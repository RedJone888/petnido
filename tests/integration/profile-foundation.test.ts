import { beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import { petRouter } from "../../src/server/trpc/routers/pet";
import { profileRouter } from "../../src/server/trpc/routers/profile";
import { savedLocationRouter } from "../../src/server/trpc/routers/savedLocation";
import { serviceProfileRouter } from "../../src/server/trpc/routers/serviceProfile";

const prisma = new PrismaClient();

function context(userId: string) {
  return {
    prisma,
    session: { user: { id: userId, email: `${userId}@example.com` } },
    requestIp: "192.0.2.50",
    requestId: "profile-foundation-test",
  } as any;
}

async function reset() {
  await prisma.serviceProfile.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(email: string) {
  return prisma.user.create({
    data: { email, profile: { create: {} } },
  });
}

beforeEach(reset);

describe("profile foundation", () => {
  it("advances first-time profile and intent on the server", async () => {
    const user = await createUser("first@example.com");
    const caller = profileRouter.createCaller(context(user.id));

    await expect(
      caller.completeOnboardingProfile({
        nickname: "Mika",
        avatarUrl: null,
        preferredLocale: "ja",
        timeZone: "Asia/Tokyo",
      }),
    ).resolves.toEqual({ nextStep: "INTENT" });
    await expect(
      caller.chooseInitialIntent({ intent: "POST_NEED" }),
    ).resolves.toEqual({ nextStep: "COMPLETE" });

    const profile = await prisma.profile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile).toMatchObject({
      onboardingStep: "COMPLETE",
      initialIntent: "POST_NEED",
    });
  });

  it("confirms provider mode and creates one service profile", async () => {
    const user = await createUser("provider@example.com");
    const profileCaller = profileRouter.createCaller(context(user.id));
    await profileCaller.completeOnboardingProfile({
      nickname: "Provider",
      avatarUrl: null,
      preferredLocale: "ja",
      timeZone: "Asia/Tokyo",
    });
    await profileCaller.chooseInitialIntent({ intent: "OFFER_SERVICE" });

    const providerCaller = serviceProfileRouter.createCaller(context(user.id));
    await expect(
      providerCaller.completeOnboarding({
        introduction: "I have cared for cats for several years.",
        monthsExperience: 36,
      }),
    ).resolves.toEqual({ nextStep: "COMPLETE" });

    expect(await prisma.serviceProfile.count({ where: { userId: user.id } })).toBe(
      1,
    );
    expect(
      await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } }),
    ).toMatchObject({ onboardingStep: "COMPLETE", isSitter: true });
  });

  it("isolates pet updates and archives instead of deleting", async () => {
    const owner = await createUser("owner@example.com");
    const other = await createUser("other@example.com");
    const ownerCaller = petRouter.createCaller(context(owner.id));
    const otherCaller = petRouter.createCaller(context(other.id));
    const pet = await ownerCaller.create({
      name: "Mochi",
      type: "CAT",
      breed: null,
      age: 3,
      notes: "Indoor cat",
    });

    await expect(
      otherCaller.update({ id: pet.id, name: "Not mine" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await ownerCaller.archive({ id: pet.id });

    expect(await ownerCaller.listMine()).toEqual([]);
    expect(await prisma.pet.count({ where: { id: pet.id } })).toBe(1);
  });

  it("keeps one default location and rejects precise location text", async () => {
    const user = await createUser("location@example.com");
    const caller = savedLocationRouter.createCaller(context(user.id));
    const first = await caller.create({
      label: "Home area",
      lat: 35.681236,
      lon: 139.767125,
      regionLabel: "Chiyoda, Tokyo",
      displayPrecision: "MAP_POINT",
      makeDefault: false,
    });
    const second = await caller.create({
      label: "Weekend area",
      lat: 35.6895,
      lon: 139.6917,
      regionLabel: "Shinjuku, Tokyo",
      displayPrecision: "DISTRICT",
      makeDefault: true,
    });

    expect(first.isDefault).toBe(true);
    expect(second.isDefault).toBe(true);
    const locations = await caller.listMine();
    expect(locations.filter((location) => location.isDefault)).toHaveLength(1);
    expect(locations.find((location) => location.id === second.id)?.isDefault).toBe(
      true,
    );

    await expect(
      caller.create({
        label: "Too precise",
        lat: 35.68,
        lon: 139.76,
        regionLabel: "1号 3階",
        displayPrecision: "MAP_POINT",
        makeDefault: false,
      }),
    ).rejects.toThrow();
  });
});
