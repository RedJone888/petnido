import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import {
  servicePublishSchema,
  type ServicePublishInput,
} from "../../src/domain/publishing/contracts";
import { publishServiceV2Transaction } from "../../src/server/domains/publishing/publish-service-v2";

const prisma = new PrismaClient();
const now = new Date("2026-08-01T00:00:00.000Z");

async function reset() {
  await prisma.serviceV2.deleteMany();
  await prisma.needV2.deleteMany();
  await prisma.locationSnapshotV2.deleteMany();
  await prisma.publishDraftV2.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.serviceProfile.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(reset);

async function createProvider(email: string) {
  return prisma.user.create({
    data: {
      email,
      serviceProfile: { create: { introduction: "Experienced pet carer" } },
    },
    include: { serviceProfile: true },
  });
}

async function createDraft(
  ownerId: string,
  id: string,
  mode: ServicePublishInput["mode"],
  editingServiceId?: string,
) {
  await prisma.publishDraftV2.create({
    data: {
      id,
      ownerId,
      kind: "SERVICE",
      mode,
      schemaVersion: 1,
      revision: 0,
      currentStep: "review",
      payloadJson: "{}",
      status: "ACTIVE",
      editingServiceId,
    },
  });
}

function common(draftId: string) {
  return {
    schemaVersion: 1 as const,
    draftId,
    revision: 0,
    idempotencyKey: randomUUID(),
    title: "Thoughtful care for cats",
    description: "Calm, structured care with daily updates.",
    timeZone: "Asia/Tokyo",
    location: {
      lat: 35.681236,
      lon: 139.767125,
      regionLabel: "Chiyoda, Tokyo",
      displayPrecision: "DISTRICT" as const,
    },
    currency: "JPY" as const,
    availabilityRules: [
      {
        kind: "WEEKLY" as const,
        weekdays: [1, 2, 3, 4, 5],
        startsOn: null,
        endsOn: null,
        includesHolidays: false,
      },
    ],
    availabilityExceptions: [
      { date: "2026-08-12", available: false, note: "Unavailable" },
    ],
    petPolicies: [
      {
        petType: "CAT",
        size: "ANY" as const,
        ageBand: "ADULT" as const,
        accepted: true,
        notes: null,
      },
    ],
    offerings: [
      {
        category: "FEEDING",
        label: "Feeding and water",
        description: "Follow the owner's portions.",
      },
    ],
    priceRules: [
      { label: "Standard", unit: "VISIT" as const, amountMinor: 3000 },
    ],
    discounts: [
      {
        label: "Weekly care",
        kind: "PERCENT" as const,
        value: 10,
        condition: "Five or more visits",
      },
    ],
    attachmentIds: [],
  };
}

async function publish(ownerId: string, input: ServicePublishInput) {
  return prisma.$transaction((tx) =>
    publishServiceV2Transaction(tx as never, ownerId, input, now, {
      validationArrayEncoding: true,
    }),
  );
}

describe("V2 service publication transaction", () => {
  it("publishes home visits atomically, saves defaults and replays", async () => {
    const owner = await createProvider("service-home@example.com");
    const attachment = await prisma.attachment.create({
      data: {
        userId: owner.id,
        url: "/uploads/experience.jpg",
        fileKey: "experience.jpg",
        signature: "sig",
        status: 0,
      },
    });
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "HOME_VISIT");
    const input = servicePublishSchema.parse({
      ...common(draftId),
      attachmentIds: [attachment.id],
      mode: "HOME_VISIT",
      homeVisit: { serviceRadiusMeters: 5000 },
    });

    const first = await publish(owner.id, input);
    const replay = await publish(owner.id, input);

    expect(replay).toEqual({
      serviceId: first.serviceId,
      replayed: true,
      edited: false,
    });
    expect(
      await prisma.serviceV2.findUnique({
        where: { id: first.serviceId },
        include: {
          availabilityRules: true,
          availabilityExceptions: true,
          petPolicies: true,
          offerings: true,
          priceRules: true,
          discounts: true,
          attachments: true,
        },
      }),
    ).toMatchObject({
      state: "ACTIVE",
      mode: "HOME_VISIT",
      serviceRadiusMeters: 5000,
      maxPetCapacity: null,
      petPolicies: [{ petType: "CAT", accepted: true }],
      offerings: [{ category: "FEEDING" }],
      discounts: [{ kind: "PERCENT", value: 10 }],
      attachments: [{ attachmentId: attachment.id, purpose: "EXPERIENCE" }],
    });
    const profile = await prisma.serviceProfile.findUniqueOrThrow({
      where: { userId: owner.id },
    });
    expect(profile.baseCurrency).toBe("JPY");
    expect(profile.defaultLocationId).toBeTruthy();
    expect(await prisma.userLocation.count({ where: { userId: owner.id } })).toBe(1);
    expect(await prisma.attachment.findUnique({ where: { id: attachment.id } })).toMatchObject({ status: 1 });
  });

  it("publishes boarding environment and uses pet-count capacity only there", async () => {
    const owner = await createProvider("service-boarding@example.com");
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "BOARDING");
    const input = servicePublishSchema.parse({
      ...common(draftId),
      mode: "BOARDING",
      boarding: {
        maxPetCapacity: 3,
        environmentDescription: "Secure indoor rooms and fenced garden.",
        residentPetNotes: "One calm adult cat.",
        suppliedItems: ["Bowls", "Pet beds"],
      },
    });

    const result = await publish(owner.id, input);
    expect(
      await prisma.serviceV2.findUnique({
        where: { id: result.serviceId },
        include: { boardingDetail: true },
      }),
    ).toMatchObject({
      mode: "BOARDING",
      serviceRadiusMeters: null,
      maxPetCapacity: 3,
      boardingDetail: {
        environmentDescription: "Secure indoor rooms and fenced garden.",
        suppliedItems: JSON.stringify(["Bowls", "Pet beds"]),
      },
    });
  });

  it("publishes a custom service without using boarding capacity", async () => {
    const owner = await createProvider("service-custom@example.com");
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "CUSTOM");
    const input = servicePublishSchema.parse({
      ...common(draftId),
      priceRules: [{ label: "Trip", unit: "FIXED", amountMinor: 6000 }],
      mode: "CUSTOM",
      custom: { serviceRadiusMeters: null },
    });

    const result = await publish(owner.id, input);
    expect(await prisma.serviceV2.findUnique({ where: { id: result.serviceId } })).toMatchObject({
      mode: "CUSTOM",
      serviceRadiusMeters: null,
      maxPetCapacity: null,
    });
  });

  it("rolls back service and profile defaults when an attachment is not owned", async () => {
    const owner = await createProvider("service-owner@example.com");
    const other = await createProvider("service-other@example.com");
    const attachment = await prisma.attachment.create({
      data: {
        userId: other.id,
        url: "/uploads/foreign.jpg",
        fileKey: "foreign.jpg",
        signature: "sig",
      },
    });
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "CUSTOM");
    const input = servicePublishSchema.parse({
      ...common(draftId),
      attachmentIds: [attachment.id],
      mode: "CUSTOM",
      custom: { serviceRadiusMeters: 3000 },
    });

    await expect(publish(owner.id, input)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await prisma.serviceV2.count()).toBe(0);
    expect(await prisma.userLocation.count({ where: { userId: owner.id } })).toBe(0);
    expect(await prisma.serviceProfile.findUnique({ where: { userId: owner.id } })).toMatchObject({
      baseCurrency: null,
      defaultLocationId: null,
    });
  });

  it("rejects cross-draft idempotency reuse and edits the same aggregate", async () => {
    const owner = await createProvider("service-edit@example.com");
    const firstDraftId = randomUUID();
    await createDraft(owner.id, firstDraftId, "HOME_VISIT");
    const firstInput = servicePublishSchema.parse({
      ...common(firstDraftId),
      mode: "HOME_VISIT",
      homeVisit: { serviceRadiusMeters: 5000 },
    });
    const first = await publish(owner.id, firstInput);

    const conflictingDraftId = randomUUID();
    await createDraft(owner.id, conflictingDraftId, "HOME_VISIT");
    const conflicting = servicePublishSchema.parse({
      ...common(conflictingDraftId),
      idempotencyKey: firstInput.idempotencyKey,
      mode: "HOME_VISIT",
      homeVisit: { serviceRadiusMeters: 9000 },
    });
    await expect(publish(owner.id, conflicting)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "IDEMPOTENCY_KEY_REUSED",
    });

    const editDraftId = randomUUID();
    await createDraft(owner.id, editDraftId, "BOARDING", first.serviceId);
    const editInput = servicePublishSchema.parse({
      ...common(editDraftId),
      title: "Updated boarding service",
      currency: "USD",
      mode: "BOARDING",
      boarding: {
        maxPetCapacity: 2,
        environmentDescription: "A quiet private room.",
        residentPetNotes: null,
        suppliedItems: [],
      },
    });
    const edited = await publish(owner.id, editInput);
    const replay = await publish(owner.id, editInput);

    expect(edited).toMatchObject({ serviceId: first.serviceId, edited: true, replayed: false });
    expect(replay).toEqual({ serviceId: first.serviceId, edited: true, replayed: true });
    expect(await prisma.serviceV2.count()).toBe(1);
    expect(await prisma.locationSnapshotV2.count()).toBe(1);
    expect(await prisma.userLocation.count({ where: { userId: owner.id } })).toBe(1);
    expect(
      await prisma.serviceV2.findUnique({
        where: { id: first.serviceId },
        include: { boardingDetail: true, priceRules: true },
      }),
    ).toMatchObject({
      title: "Updated boarding service",
      mode: "BOARDING",
      serviceRadiusMeters: null,
      maxPetCapacity: 2,
      boardingDetail: { environmentDescription: "A quiet private room." },
      priceRules: [{ amountMinor: 3000n }],
    });
    expect(await prisma.serviceProfile.findUnique({ where: { userId: owner.id } })).toMatchObject({
      baseCurrency: "USD",
    });
  });
});
