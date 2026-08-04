import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import { publishDraftRouter } from "../../src/server/trpc/routers/publishDraft";

const prisma = new PrismaClient();

function context(userId: string) {
  return {
    prisma,
    session: { user: { id: userId, email: `${userId}@example.com` } },
    requestIp: "192.0.2.70",
    requestId: "publish-draft-test",
  } as any;
}

async function reset() {
  process.env.FEATURE_PUBLISHING_V2 = "true";
  await prisma.publishDraftV2.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(email: string) {
  return prisma.user.create({ data: { email } });
}

beforeEach(reset);
afterAll(async () => {
  delete process.env.FEATURE_PUBLISHING_V2;
  await prisma.$disconnect();
});

describe("versioned publish drafts", () => {
  it("creates idempotently and returns structured payload", async () => {
    const user = await createUser("draft-owner@example.com");
    const caller = publishDraftRouter.createCaller(context(user.id));
    const input = {
      id: "11111111-1111-4111-8111-111111111111",
      kind: "NEED" as const,
      mode: "HOME_VISIT" as const,
      currentStep: "pets",
      payload: { title: "Care for Mochi" },
    };

    const created = await caller.create(input);
    const retried = await caller.create(input);

    expect(created).toMatchObject({ revision: 0, payload: input.payload });
    expect(retried).toMatchObject({ id: created.id, revision: 0 });
    expect(await prisma.publishDraftV2.count()).toBe(1);
  });

  it("uses revision locking and rejects stale saves", async () => {
    const user = await createUser("draft-revision@example.com");
    const caller = publishDraftRouter.createCaller(context(user.id));
    const id = "22222222-2222-4222-8222-222222222222";
    await caller.create({
      id,
      kind: "NEED",
      mode: null,
      currentStep: "care",
      payload: {},
    });

    await expect(
      caller.save({
        id,
        kind: "NEED",
        mode: "BOARDING",
        expectedRevision: 0,
        currentStep: "pets",
        payload: { title: "Boarding request" },
      }),
    ).resolves.toMatchObject({ revision: 1, mode: "BOARDING" });
    await expect(
      caller.save({
        id,
        kind: "NEED",
        mode: "BOARDING",
        expectedRevision: 0,
        currentStep: "dates",
        payload: { title: "Stale edit" },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", message: "DRAFT_REVISION_CONFLICT" });
  });

  it("hides other users' drafts and rejects raw address payloads", async () => {
    const owner = await createUser("draft-private@example.com");
    const other = await createUser("draft-other@example.com");
    const ownerCaller = publishDraftRouter.createCaller(context(owner.id));
    const otherCaller = publishDraftRouter.createCaller(context(other.id));
    const id = "33333333-3333-4333-8333-333333333333";
    await ownerCaller.create({
      id,
      kind: "NEED",
      mode: null,
      currentStep: "care",
      payload: {},
    });

    await expect(otherCaller.getMine({ id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      ownerCaller.create({
        id: "44444444-4444-4444-8444-444444444444",
        kind: "NEED",
        mode: null,
        currentStep: "area",
        payload: { addressRaw: "1-2-3 Example" } as never,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("abandons idempotently and prevents later saves", async () => {
    const user = await createUser("draft-abandon@example.com");
    const caller = publishDraftRouter.createCaller(context(user.id));
    const id = "55555555-5555-4555-8555-555555555555";
    await caller.create({
      id,
      kind: "SERVICE",
      mode: "CUSTOM",
      currentStep: "service",
      payload: {},
    });

    await expect(caller.abandon({ id })).resolves.toMatchObject({
      status: "ABANDONED",
    });
    await expect(caller.abandon({ id })).resolves.toMatchObject({
      status: "ABANDONED",
    });
    await expect(
      caller.save({
        id,
        kind: "SERVICE",
        mode: "CUSTOM",
        expectedRevision: 0,
        currentStep: "pricing",
        payload: {},
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
