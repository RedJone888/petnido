import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import { needPublishingRouter } from "../../src/modules/need-publishing/api/router";
import { marketplaceNeedRouter } from "../../src/server/trpc/routers/marketplaceNeed";

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
  process.env.FEATURE_PUBLIC_MARKETPLACE_V2 = "true";
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
  delete process.env.FEATURE_PUBLIC_MARKETPLACE_V2;
  await prisma.$disconnect();
});

describe("V2 need owner management", () => {
  it("lists owner-safe DTOs and derives expiry without mutating state", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-owner@example.com" } });
    const other = await prisma.user.create({ data: { email: "v2-other@example.com" } });
    const expired = await createNeed(owner.id, new Date("2020-01-01T00:00:00Z"));
    await createNeed(other.id);
    const caller = needPublishingRouter.createCaller(context(owner.id));

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
      needPublishingRouter.createCaller(context(other.id)).getMine({ id: need.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lists public V2 needs with the validation Prisma client", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-marketplace@example.com" } });
    const need = await createNeed(owner.id, new Date("2099-01-01T00:00:00Z"));
    const caller = marketplaceNeedRouter.createCaller(context(owner.id));

    const result = await caller.list({ filter: {}, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      publicId: `v2:${need.id}`,
      source: "V2",
      title: "Mochi · Custom pet care",
      owner: { requestsCount: 1 },
    });
  });

  it("loads an edit baseline without creating a draft until it is dirty", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-edit@example.com" } });
    const need = await createNeed(owner.id);
    const caller = needPublishingRouter.createCaller(context(owner.id));

    const first = await caller.beginEdit({ id: need.id });
    const resumed = await caller.beginEdit({ id: need.id });

    expect(first.id).toBeNull();
    expect(resumed.id).toBeNull();
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
    ).toBe(0);

    const dirty = await caller.createEditDraft({
      id: randomUUID(),
      needId: need.id,
      mode: "CUSTOM",
      currentStep: "preview",
      payload: first.payload,
    });
    expect(dirty).toMatchObject({
      editingNeedId: need.id,
      isDirty: true,
      status: "ACTIVE",
    });
    expect(
      await prisma.publishDraftV2.count({
        where: { ownerId: owner.id, editingNeedId: need.id, status: "ACTIVE" },
      }),
    ).toBe(1);
  });

  it("blocks matched edits but lets the owner reuse the request as a new draft", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-reuse-owner@example.com" } });
    const other = await prisma.user.create({ data: { email: "v2-reuse-other@example.com" } });
    const need = await createNeed(owner.id);
    await prisma.needV2.update({ where: { id: need.id }, data: { state: "MATCHED" } });

    const ownerCaller = needPublishingRouter.createCaller(context(owner.id));
    const otherCaller = needPublishingRouter.createCaller(context(other.id));

    await expect(ownerCaller.beginEdit({ id: need.id })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "NEED_MATCHED_EDIT_REQUIRES_CANCEL_MATCH",
    });
    await expect(otherCaller.reuse({ id: need.id, draftId: randomUUID() })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const reuseDraftId = randomUUID();
    const reused = await ownerCaller.reuse({ id: need.id, draftId: reuseDraftId });
    const replayed = await ownerCaller.reuse({ id: need.id, draftId: reuseDraftId });
    expect(reused).toMatchObject({
      sourceNeedId: need.id,
      clonedFromNeedId: need.id,
      editingNeedId: null,
      currentStep: "pets",
      status: "ACTIVE",
    });
    expect(reused.payload).toMatchObject({
      startsAt: null,
      endsAt: null,
      workspace: { common: { confirmedScreenIds: ["care"] } },
    });
    expect(replayed.id).toBe(reused.id);
    expect(
      await prisma.publishDraftV2.count({ where: { id: reuseDraftId } }),
    ).toBe(1);
    expect(await prisma.needV2.findUnique({ where: { id: need.id }, select: { state: true } })).toEqual({
      state: "MATCHED",
    });
  });

  it("closes with optimistic concurrency and rejects stale commands", async () => {
    const owner = await prisma.user.create({ data: { email: "v2-command@example.com" } });
    const need = await createNeed(owner.id);
    const caller = needPublishingRouter.createCaller(context(owner.id));

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
