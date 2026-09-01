import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import { validationRouter } from "../../src/validation/vertical-slice/router";
import { confirmValidationBooking, listPublicNeeds, publishHomeVisit } from "../../src/validation/vertical-slice/service";

const prisma = new PrismaClient();
const now = new Date("2030-01-15T00:00:00.000Z");

async function clearDatabase() {
  await prisma.validationBooking.deleteMany();
  await prisma.validationCapacityBucket.deleteMany();
  await prisma.validationService.deleteMany();
  await prisma.validationNeedTask.deleteMany();
  await prisma.validationPetSnapshot.deleteMany();
  await prisma.validationNeed.deleteMany();
  await prisma.validationLocation.deleteMany();
  await prisma.validationPet.deleteMany();
  await prisma.validationUser.deleteMany();
}

async function createOwner() {
  return prisma.validationUser.create({
    data: {
      email: `${randomUUID()}@petnido.example.invalid`,
      pets: { create: { name: "Mugi", petType: "CAT", careNotes: "Protected care note" } },
    },
    include: { pets: true },
  });
}

function publishInput(petId: string, endsAt = "2030-01-20T00:00:00.000Z") {
  return {
    idempotencyKey: randomUUID(),
    mode: "HOME_VISIT" as const,
    title: "Fixture visit",
    startsAt: "2030-01-16T00:00:00.000Z",
    endsAt,
    timeZone: "Asia/Tokyo",
    pets: [{ source: "PROFILE" as const, petId }],
    location: { lat: 35.681236, lon: 139.767125, regionLabel: "Fixture Central", displayPrecision: "MAP_POINT" as const },
    budget: { kind: "FIXED" as const, amountMinor: 5000, currency: "JPY" as const },
    visits: [
      {
        scheduledAt: "2030-01-16T03:00:00.000Z",
        tasks: [{ petRef: petId, taskCategory: "FEED" as const, instructions: "Fixture task" }],
      },
    ],
    transportFee: { kind: "INCLUDED" as const },
  };
}

beforeEach(clearDatabase);
afterAll(async () => prisma.$disconnect());

describe("home-visit vertical slice", () => {
  it("publishes through the tRPC contract, writes snapshots/defaults, and is idempotent", async () => {
    const owner = await createOwner();
    const caller = validationRouter.createCaller({ prisma, userId: owner.id, now });
    const input = publishInput(owner.pets[0].id);

    const first = await caller.publishHomeVisit(input);
    const second = await caller.publishHomeVisit(input);

    expect(second.id).toBe(first.id);
    expect(await prisma.validationNeed.count()).toBe(1);
    expect(await prisma.validationPetSnapshot.count()).toBe(1);
    expect(await prisma.validationLocation.findUnique({ where: { userId: owner.id } })).toMatchObject({
      lat: input.location.lat,
      lon: input.location.lon,
    });
  });

  it("excludes a need at the exact end time without a scheduler", async () => {
    const owner = await createOwner();
    const input = publishInput(owner.pets[0].id);
    const need = await publishHomeVisit(prisma, owner.id, input);

    expect((await listPublicNeeds(prisma, now)).map((item) => item.id)).toContain(need.id);
    expect((await listPublicNeeds(prisma, new Date(input.endsAt))).map((item) => item.id)).not.toContain(need.id);
  });

  it("rolls back pets, need, snapshots, and default location on a mid-transaction conflict", async () => {
    const owner = await createOwner();
    const input = publishInput(owner.pets[0].id);
    input.pets.push({ source: "PROFILE", petId: owner.pets[0].id });

    await expect(publishHomeVisit(prisma, owner.id, input)).rejects.toBeTruthy();
    expect(await prisma.validationNeed.count()).toBe(0);
    expect(await prisma.validationLocation.count()).toBe(0);
    expect(await prisma.validationPetSnapshot.count()).toBe(0);
  });
});

describe("boarding capacity vertical slice", () => {
  it("lets only one request take the last pet slot", async () => {
    const service = await prisma.validationService.create({
      data: { mode: "BOARDING", state: "ACTIVE", maxPetCapacity: 4 },
    });
    const base = {
      serviceId: service.id,
      startsAt: "2030-01-16T00:00:00.000Z",
      endsAt: "2030-01-17T00:00:00.000Z",
    };
    await confirmValidationBooking(prisma, { ...base, petCount: 3, idempotencyKey: randomUUID() });

    const attempts = await Promise.allSettled([
      confirmValidationBooking(prisma, { ...base, petCount: 1, idempotencyKey: randomUUID() }),
      confirmValidationBooking(prisma, { ...base, petCount: 1, idempotencyKey: randomUUID() }),
    ]);

    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.validationBooking.count()).toBe(2);
    expect(await prisma.validationCapacityBucket.findFirst()).toMatchObject({ bookedPetCount: 4 });
  });

  it("does not apply pet capacity to home visits", async () => {
    const service = await prisma.validationService.create({ data: { mode: "HOME_VISIT", state: "ACTIVE" } });
    await expect(
      confirmValidationBooking(prisma, {
        serviceId: service.id,
        startsAt: "2030-01-16T00:00:00.000Z",
        endsAt: "2030-01-17T00:00:00.000Z",
        petCount: 20,
        idempotencyKey: randomUUID(),
      }),
    ).resolves.toMatchObject({ state: "CONFIRMED" });
    expect(await prisma.validationCapacityBucket.count()).toBe(0);
  });
});
