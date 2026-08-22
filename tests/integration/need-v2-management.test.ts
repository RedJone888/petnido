import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import { needV2Router } from "../../src/server/trpc/routers/needV2";

const prisma = new PrismaClient();

function context(userId: string) {
  return {
    prisma,
    session: { user: { id: userId, email: `${userId}@example.com` } },
    requestIp: "192.0.2.80",
    requestId: "need-v2-management-test",
  } as any;
}

async function reset() {
  process.env.FEATURE_PUBLISHING_V2 = "true";
  await prisma.serviceV2.deleteMany();
  await prisma.needV2.deleteMany();
  await prisma.locationSnapshotV2.deleteMany();
  await prisma.publishDraftV2.deleteMany();
  await prisma.user.deleteMany();
}

async function createNeed(ownerId: string, endsAt = new Date("2026-08-20T00:00:00Z")) {
  const location = await prisma.locationSnapshotV2.create({
    data: {
      lat: 35.68,
      lon: 139.76,
      regionLabel: "Tokyo",
      displayPrecision: "DISTRICT",
    },
  });
  return prisma.needV2.create({
    data: {
      idempotencyKey: randomUUID(),
      ownerId,
      mode: "CUSTOM",
      state: "OPEN",
      title: "Help Mochi",
      startsAt: new Date("2026-08-10T00:00:00Z"),
      endsAt,
      timeZone: "Asia/Tokyo",
      locationSnapshotId: location.id,
      budgetKind: "EXACT",
      minAmountMinor: 5000n,
      maxAmountMinor: null,
      currency: "JPY",
      pets: {
        create: {
          clientPetKey: "pet-1",
          quantity: 2,
          name: "Mochi",
          petType: "CAT",
          sex: "UNKNOWN",
          neutered: "UNKNOWN",
        },
      },
      tasks: {
        create: {
          clientTaskKey: "task-1",
          category: "CUSTOM",
          label: "Custom help",
          priority: "MUST",
          scheduleKind: "DAILY",
          visitNumbers: "[]",
          order: 0,
        },
      },
    },
  });
}

beforeEach(reset);
afterAll(async () => {
  delete process.env.FEATURE_PUBLISHING_V2;
  await prisma.$disconnect();
});

describe("V2 need owner management", () => {
  it("lists owner-safe DTOs and derives expiry without mutating state", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-owner@example.com" } });
    const other = await prisma.user.create({ data: { email: "v2-other@example.com" } });
    const expired = await createNeed(owner.id, new Date("2020-01-01T00:00:00Z"));
    await createNeed(other.id);
    const caller = needV2Router.createCaller(context(owner.id));

    const result = await caller.listMine();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: expired.id,
      state: "OPEN",
      expired: true,
      minAmountMinor: 5000,
      pets: [{ quantity: 2 }],
      tasks: [{ visitNumbers: [] }],
      locationSnapshot: { lat: 35.68, lon: 139.76 },
    });
    expect(await prisma.needV2.findUnique({ where: { id: expired.id } })).toMatchObject({
      state: "OPEN",
    });
  });

  it("hides another owner's record", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-private@example.com" } });
    const other = await prisma.user.create({ data: { email: "v2-reader@example.com" } });
    const need = await createNeed(owner.id);

    await expect(
      needV2Router.createCaller(context(other.id)).getMine({ id: need.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates one resumable edit draft from the persisted V2 snapshot", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-edit@example.com" } });
    const need = await createNeed(owner.id);
    const caller = needV2Router.createCaller(context(owner.id));

    const first = await caller.beginEdit({ id: need.id });
    const resumed = await caller.beginEdit({ id: need.id });

    expect(resumed.id).toBe(first.id);
    expect(first).toMatchObject({
      kind: "NEED",
      mode: "CUSTOM",
      status: "ACTIVE",
      revision: 0,
      editingNeedId: need.id,
      payload: {
        description: null,
        timeZone: "Asia/Tokyo",
        pets: [{ clientPetKey: "pet-1", quantity: 2 }],
        budget: { kind: "EXACT", minAmountMinor: 5000, currency: "JPY" },
        custom: { tasks: [{ clientTaskKey: "task-1" }], requirements: [] },
      },
    });
    expect(JSON.stringify(first.payload)).not.toMatch(/addressRaw|areaRaw/i);
    expect(
      await prisma.publishDraftV2.count({
        where: { ownerId: owner.id, editingNeedId: need.id, status: "ACTIVE" },
      }),
    ).toBe(1);
  });

  it("closes with optimistic concurrency and rejects stale commands", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-command@example.com" } });
    const need = await createNeed(owner.id);
    const caller = needV2Router.createCaller(context(owner.id));

    await expect(
      caller.executeCommand({
        id: need.id,
        command: "CLOSE",
        expectedUpdatedAt: need.updatedAt,
      }),
    ).resolves.toMatchObject({ state: "CLOSED" });
    await expect(
      caller.executeCommand({
        id: need.id,
        command: "CANCEL",
        expectedUpdatedAt: need.updatedAt,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
