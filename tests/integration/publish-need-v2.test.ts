import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import { needPublishSchema, type NeedPublishInput } from "../../src/domain/publishing/contracts";
import { publishNeedV2Transaction } from "../../src/server/domains/publishing/publish-need-v2";

const prisma = new PrismaClient();
const now = new Date("2026-08-01T00:00:00.000Z");

async function reset() {
  await prisma.serviceV2.deleteMany();
  await prisma.needV2.deleteMany();
  await prisma.locationSnapshotV2.deleteMany();
  await prisma.publishDraftV2.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(reset);

function common(draftId: string) {
  return {
    schemaVersion: 1 as const,
    draftId,
    revision: 0,
    idempotencyKey: randomUUID(),
    title: "Care for Mochi",
    description: "Please follow the care plan.",
    startsAt: "2026-08-10T00:00:00+09:00",
    endsAt: "2026-08-13T00:00:00+09:00",
    timeZone: "Asia/Tokyo",
    pets: [
      {
        clientPetKey: "pet-1",
        sourcePetId: null,
        profileAction: "CREATE" as const,
        quantity: 2,
        name: "Mochi",
        petType: "CAT",
        breed: "Domestic shorthair",
        birthDate: "2022-04-10",
        weightGrams: 4200,
        sex: "FEMALE" as const,
        neutered: "YES" as const,
        careNotes: "Indoor cat",
      },
    ],
    location: {
      lat: 35.681236,
      lon: 139.767125,
      regionLabel: "Chiyoda, Tokyo",
      displayPrecision: "DISTRICT" as const,
    },
    budget: {
      kind: "EXACT" as const,
      minAmountMinor: 8000,
      maxAmountMinor: null,
      currency: "JPY" as const,
      negotiable: false,
    },
    additionalCosts: [
      { kind: "TRAVEL" as const, mode: "NONE" as const, amountMinor: null },
    ],
    attachmentIds: [],
  };
}

function task(scheduleKind: "EACH_VISIT" | "DAILY" = "DAILY") {
  return {
    clientTaskKey: "task-1",
    category: "FEEDING",
    label: "Feed dinner",
    instructions: "Use the measured portion",
    priority: "MUST" as const,
    petKeys: ["pet-1"],
    scheduleKind,
    visitNumbers: scheduleKind === "EACH_VISIT" ? [1] : [],
    order: 0,
  };
}

async function createDraft(
  ownerId: string,
  id: string,
  mode: NeedPublishInput["mode"],
  editingNeedId?: string,
) {
  await prisma.publishDraftV2.create({
    data: {
      id,
      ownerId,
      kind: "NEED",
      mode,
      schemaVersion: 1,
      revision: 0,
      currentStep: "preview",
      payloadJson: "{}",
      status: "ACTIVE",
      editingNeedId,
    },
  });
}

async function publish(ownerId: string, input: NeedPublishInput) {
  return prisma.$transaction((tx) =>
    publishNeedV2Transaction(tx as never, ownerId, input, now, {
      validationArrayEncoding: true,
    }),
  );
}

describe("V2 need publication transaction", () => {
  it("publishes a home-visit need atomically and replays the same draft", async () => {
    const owner = await prisma.user.create({ data: { email: "need-home@example.com" } });
    const attachment = await prisma.attachment.create({
      data: {
        userId: owner.id,
        url: "/uploads/care.jpg",
        fileKey: "care.jpg",
        signature: "sig",
        status: 0,
      },
    });
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "HOME_VISIT");
    const input = needPublishSchema.parse({
      ...common(draftId),
      attachmentIds: [attachment.id],
      mode: "HOME_VISIT",
      homeVisit: {
        intervalDays: 1,
        firstServiceDate: "2026-08-10",
        excludedDates: ["2026-08-12"],
        visitsPerServiceDay: 1,
        visitWindows: [
          { visitNumber: 1, kind: "PREFERRED", preferredLocalTime: "09:30" },
        ],
        tasks: [task("EACH_VISIT")],
      },
    });

    const first = await publish(owner.id, input);
    const replay = await publish(owner.id, input);

    expect(replay).toEqual({
      needId: first.needId,
      replayed: true,
      edited: false,
    });
    expect(await prisma.needV2.count()).toBe(1);
    expect(
      await prisma.needV2.findUnique({
        where: { id: first.needId },
        include: {
          pets: true,
          tasks: { include: { petLinks: true } },
          homeVisitDetail: true,
          visitWindows: true,
          dateExceptions: true,
          additionalCosts: true,
          attachments: true,
        },
      }),
    ).toMatchObject({
      state: "OPEN",
      pets: [{ quantity: 2, petType: "CAT" }],
      homeVisitDetail: { intervalDays: 1, visitsPerServiceDay: 1 },
    });
    const savedPet = await prisma.pet.findFirstOrThrow({
      where: { ownerId: owner.id },
    });
    expect(savedPet).toMatchObject({
      quantity: 2,
      birthDate: new Date("2022-04-10T00:00:00.000Z"),
      weightGrams: 4200,
      sex: "FEMALE",
      neutered: "YES",
    });
    expect(
      await prisma.needPetSnapshotV2.findFirstOrThrow({
        where: { needId: first.needId },
      }),
    ).toMatchObject({ sourcePetId: savedPet.id });
    expect(await prisma.userLocation.count({ where: { userId: owner.id } })).toBe(1);
    expect(await prisma.attachment.findUnique({ where: { id: attachment.id } })).toMatchObject({
      status: 1,
    });
    expect(await prisma.publishDraftV2.findUnique({ where: { id: draftId } })).toMatchObject({
      status: "PUBLISHED",
      publishedNeedId: first.needId,
    });
  });

  it("persists boarding supplies, requirements and transport", async () => {
    const owner = await prisma.user.create({ data: { email: "need-board@example.com" } });
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "BOARDING");
    const input = needPublishSchema.parse({
      ...common(draftId),
      mode: "BOARDING",
      boarding: {
        tasks: [task()],
        supplies: [
          {
            clientSupplyKey: "food-1",
            petKey: "pet-1",
            category: "FOOD",
            label: "Dry food",
            providedBy: "OWNER",
          },
        ],
        requirements: [
          { kind: "UNACCEPTABLE", label: "Unsecured windows", petKey: null },
        ],
        transportMode: "PROVIDER",
        handoffDirection: "SPLIT",
        maxProviderDistanceMeters: 10000,
      },
    });

    const result = await publish(owner.id, input);
    expect(
      await prisma.needV2.findUnique({
        where: { id: result.needId },
        include: { boardingDetail: true, supplies: true, requirements: true },
      }),
    ).toMatchObject({
      boardingDetail: {
        transportMode: "PROVIDER",
        handoffDirection: "SPLIT",
        maxProviderDistanceMeters: 10000,
      },
      supplies: [{ label: "Dry food", providedBy: "OWNER" }],
      requirements: [{ kind: "UNACCEPTABLE", label: "Unsecured windows" }],
    });
  });

  it("publishes custom tasks and warnings without creating a mode detail row", async () => {
    const owner = await prisma.user.create({ data: { email: "need-custom@example.com" } });
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "CUSTOM");
    const input = needPublishSchema.parse({
      ...common(draftId),
      mode: "CUSTOM",
      custom: {
        tasks: [task()],
        requirements: [
          { kind: "OTHER_NEED", label: "Quiet handling", petKey: null },
          { kind: "WARNING", label: "No retractable leash", petKey: "pet-1" },
        ],
      },
    });

    const result = await publish(owner.id, input);
    expect(
      await prisma.needV2.findUnique({
        where: { id: result.needId },
        include: { tasks: true, requirements: true },
      }),
    ).toMatchObject({
      mode: "CUSTOM",
      tasks: [{ scheduleKind: "DAILY", label: "Feed dinner" }],
      requirements: [
        { kind: "OTHER_NEED", label: "Quiet handling" },
        { kind: "WARNING", label: "No retractable leash" },
      ],
    });
  });

  it("rejects reuse of an idempotency key by a different draft", async () => {
    const owner = await prisma.user.create({
      data: { email: "need-idempotency@example.com" },
    });
    const firstDraftId = randomUUID();
    const secondDraftId = randomUUID();
    await createDraft(owner.id, firstDraftId, "CUSTOM");
    await createDraft(owner.id, secondDraftId, "CUSTOM");
    const idempotencyKey = randomUUID();
    const firstInput = needPublishSchema.parse({
      ...common(firstDraftId),
      idempotencyKey,
      mode: "CUSTOM",
      custom: { tasks: [task()], requirements: [] },
    });
    const secondInput = needPublishSchema.parse({
      ...common(secondDraftId),
      idempotencyKey,
      mode: "CUSTOM",
      custom: { tasks: [task()], requirements: [] },
    });

    await publish(owner.id, firstInput);
    await expect(publish(owner.id, secondInput)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "IDEMPOTENCY_KEY_REUSED",
    });
    expect(await prisma.needV2.count()).toBe(1);
    expect(
      await prisma.publishDraftV2.findUnique({ where: { id: secondDraftId } }),
    ).toMatchObject({ status: "ACTIVE" });
  });

  it("replaces mode details atomically when an edit draft is published", async () => {
    const owner = await prisma.user.create({
      data: { email: "need-edit@example.com" },
    });
    const createDraftId = randomUUID();
    await createDraft(owner.id, createDraftId, "CUSTOM");
    const createInput = needPublishSchema.parse({
      ...common(createDraftId),
      mode: "CUSTOM",
      custom: {
        tasks: [task()],
        requirements: [
          { kind: "WARNING", label: "Old warning", petKey: null },
        ],
      },
    });
    const created = await publish(owner.id, createInput);
    const savedPet = await prisma.pet.findFirstOrThrow({
      where: { ownerId: owner.id },
    });

    const editDraftId = randomUUID();
    await createDraft(owner.id, editDraftId, "BOARDING", created.needId);
    const editInput = needPublishSchema.parse({
      ...common(editDraftId),
      title: "Updated boarding for Mochi",
      pets: [
        {
          ...common(editDraftId).pets[0],
          sourcePetId: savedPet.id,
          profileAction: "UPDATE",
          quantity: 1,
        },
      ],
      mode: "BOARDING",
      boarding: {
        tasks: [task()],
        supplies: [],
        requirements: [
          { kind: "ENVIRONMENT_REQUIRED", label: "Quiet room", petKey: null },
        ],
        transportMode: "OWNER",
        handoffDirection: "OWNER_DROPOFF",
        maxProviderDistanceMeters: 5000,
      },
    });

    const edited = await publish(owner.id, editInput);
    const replay = await publish(owner.id, editInput);

    expect(edited).toMatchObject({
      needId: created.needId,
      replayed: false,
      edited: true,
    });
    expect(replay).toMatchObject({
      needId: created.needId,
      replayed: true,
      edited: true,
    });
    expect(await prisma.needV2.count()).toBe(1);
    expect(await prisma.locationSnapshotV2.count()).toBe(1);
    expect(
      await prisma.needV2.findUnique({
        where: { id: created.needId },
        include: {
          boardingDetail: true,
          requirements: true,
          pets: true,
        },
      }),
    ).toMatchObject({
      mode: "BOARDING",
      title: "Updated boarding for Mochi",
      boardingDetail: { maxProviderDistanceMeters: 5000 },
      requirements: [{ label: "Quiet room" }],
      pets: [{ sourcePetId: savedPet.id, quantity: 1 }],
    });
    expect(await prisma.pet.count({ where: { ownerId: owner.id } })).toBe(1);
  });

  it("rolls back every write when a referenced pet belongs to another user", async () => {
    const owner = await prisma.user.create({ data: { email: "need-owner@example.com" } });
    const other = await prisma.user.create({ data: { email: "need-other@example.com" } });
    const otherPet = await prisma.pet.create({
      data: { ownerId: other.id, name: "Private pet", type: "CAT" },
    });
    const draftId = randomUUID();
    await createDraft(owner.id, draftId, "CUSTOM");
    const input = needPublishSchema.parse({
      ...common(draftId),
      pets: [{ ...common(draftId).pets[0], sourcePetId: otherPet.id }],
      mode: "CUSTOM",
      custom: {
        tasks: [task()],
        requirements: [
          { kind: "WARNING", label: "Handle gently", petKey: "pet-1" },
        ],
      },
    });

    await expect(publish(owner.id, input)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await prisma.needV2.count({ where: { ownerId: owner.id } })).toBe(0);
    expect(await prisma.locationSnapshotV2.count()).toBe(0);
    expect(await prisma.publishDraftV2.findUnique({ where: { id: draftId } })).toMatchObject({
      status: "ACTIVE",
    });
  });

  it("honors update, copy, and do-not-save pet profile choices", async () => {
    const owner = await prisma.user.create({ data: { email: "need-pet-sync@example.com" } });
    const savedPet = await prisma.pet.create({
      data: { ownerId: owner.id, name: "Mochi", type: "CAT", notes: "Original" },
    });

    const updateDraftId = randomUUID();
    await createDraft(owner.id, updateDraftId, "CUSTOM");
    const updateInput = needPublishSchema.parse({
      ...common(updateDraftId),
      pets: [{
        ...common(updateDraftId).pets[0],
        sourcePetId: savedPet.id,
        profileAction: "UPDATE",
        name: "Mochi updated",
      }],
      mode: "CUSTOM",
      custom: { tasks: [task()], requirements: [] },
    });
    await publish(owner.id, updateInput);
    expect(await prisma.pet.findUniqueOrThrow({ where: { id: savedPet.id } })).toMatchObject({
      name: "Mochi updated",
    });

    const copyDraftId = randomUUID();
    await createDraft(owner.id, copyDraftId, "CUSTOM");
    const copyInput = needPublishSchema.parse({
      ...common(copyDraftId),
      pets: [{
        ...common(copyDraftId).pets[0],
        sourcePetId: savedPet.id,
        profileAction: "CREATE",
        name: "Mochi for this request",
      }],
      mode: "CUSTOM",
      custom: { tasks: [task()], requirements: [] },
    });
    const copied = await publish(owner.id, copyInput);
    const copiedSnapshot = await prisma.needPetSnapshotV2.findFirstOrThrow({
      where: { needId: copied.needId },
    });
    expect(await prisma.pet.count({ where: { ownerId: owner.id } })).toBe(2);
    expect(copiedSnapshot.sourcePetId).not.toBe(savedPet.id);

    const temporaryDraftId = randomUUID();
    await createDraft(owner.id, temporaryDraftId, "CUSTOM");
    const temporaryInput = needPublishSchema.parse({
      ...common(temporaryDraftId),
      pets: [{
        ...common(temporaryDraftId).pets[0],
        sourcePetId: null,
        profileAction: "NONE",
        name: "Temporary pet",
      }],
      mode: "CUSTOM",
      custom: { tasks: [task()], requirements: [] },
    });
    const temporary = await publish(owner.id, temporaryInput);
    expect(await prisma.pet.count({ where: { ownerId: owner.id } })).toBe(2);
    expect(await prisma.needPetSnapshotV2.findFirstOrThrow({
      where: { needId: temporary.needId },
    })).toMatchObject({ sourcePetId: null, name: "Temporary pet" });
  });
});
