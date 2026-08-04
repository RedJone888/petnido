import { beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import { petRouter } from "../../src/server/trpc/routers/pet";
import { profileRouter } from "../../src/server/trpc/routers/profile";
import { savedLocationRouter } from "../../src/server/trpc/routers/savedLocation";
import { serviceProfileRouter } from "../../src/server/trpc/routers/serviceProfile";
import { notificationPreferenceRouter } from "../../src/server/trpc/routers/notificationPreference";

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
  await prisma.notificationPreference.deleteMany();
  await prisma.serviceProfile.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.attachment.deleteMany();
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
    expect(
      await prisma.serviceProfile.findUniqueOrThrow({ where: { userId: user.id } }),
    ).toMatchObject({ isAccepting: true });
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

  it("promotes a replacement when the default location is archived", async () => {
    const user = await createUser("replacement@example.com");
    const locationCaller = savedLocationRouter.createCaller(context(user.id));
    const first = await locationCaller.create({
      label: "Primary",
      lat: 35.68,
      lon: 139.76,
      regionLabel: "Tokyo",
      displayPrecision: "MAP_POINT",
      makeDefault: true,
    });
    const second = await locationCaller.create({
      label: "Secondary",
      lat: 34.69,
      lon: 135.5,
      regionLabel: "Osaka",
      displayPrecision: "DISTRICT",
      makeDefault: false,
    });
    await prisma.serviceProfile.create({
      data: { userId: user.id, defaultLocationId: first.id },
    });

    await expect(locationCaller.archive({ id: first.id })).resolves.toEqual({
      success: true,
      defaultLocationId: second.id,
    });
    expect(await locationCaller.listMine()).toEqual([
      expect.objectContaining({ id: second.id, isDefault: true }),
    ]);
    expect(
      await prisma.serviceProfile.findUniqueOrThrow({ where: { userId: user.id } }),
    ).toMatchObject({ defaultLocationId: second.id });
  });

  it("keeps provider defaults owned and persists the global accepting switch", async () => {
    const provider = await createUser("settings-provider@example.com");
    const other = await createUser("settings-other@example.com");
    await prisma.profile.update({
      where: { userId: provider.id },
      data: { onboardingStep: "COMPLETE" },
    });
    const otherLocation = await savedLocationRouter
      .createCaller(context(other.id))
      .create({
        label: "Other",
        lat: 35.1,
        lon: 139.1,
        regionLabel: "Other area",
        displayPrecision: "DISTRICT",
        makeDefault: true,
      });
    const caller = serviceProfileRouter.createCaller(context(provider.id));
    await caller.enableOffering();
    await expect(
      caller.updateSettings({
        introduction: "Care experience",
        monthsExperience: 24,
        defaultLocationId: otherLocation.id,
        baseCurrency: "JPY",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.setAccepting({ active: false })).resolves.toMatchObject({
      isAccepting: false,
    });
  });

  it("persists email notification preference per user", async () => {
    const user = await createUser("notify@example.com");
    const other = await createUser("notify-other@example.com");
    const caller = notificationPreferenceRouter.createCaller(context(user.id));
    const otherCaller = notificationPreferenceRouter.createCaller(context(other.id));

    await expect(caller.getMine()).resolves.toMatchObject({ emailInstant: false });
    await expect(caller.updateMine({ emailInstant: true })).resolves.toMatchObject({
      emailInstant: true,
    });
    await expect(otherCaller.getMine()).resolves.toMatchObject({
      emailInstant: false,
    });
  });

  it("only promotes owned temporary attachments to the current avatar", async () => {
    const user = await createUser("avatar@example.com");
    const other = await createUser("avatar-other@example.com");
    const ownAttachment = await prisma.attachment.create({
      data: {
        userId: user.id,
        url: "https://cdn.example/avatar-one.jpg",
        fileKey: "avatar-one",
        signature: "avatar-one",
      },
    });
    const replacement = await prisma.attachment.create({
      data: {
        userId: user.id,
        url: "https://cdn.example/avatar-two.jpg",
        fileKey: "avatar-two",
        signature: "avatar-two",
      },
    });
    const otherAttachment = await prisma.attachment.create({
      data: {
        userId: other.id,
        url: "https://cdn.example/not-owned.jpg",
        fileKey: "not-owned",
        signature: "not-owned",
      },
    });
    const caller = profileRouter.createCaller(context(user.id));

    await expect(
      caller.setAvatarAttachment({ attachmentId: otherAttachment.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await caller.setAvatarAttachment({ attachmentId: ownAttachment.id });
    await caller.setAvatarAttachment({ attachmentId: replacement.id });

    expect(await prisma.attachment.findUniqueOrThrow({ where: { id: ownAttachment.id } })).toMatchObject({ status: 2 });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({
      image: replacement.url,
      avatarAttachmentId: replacement.id,
    });
    await caller.removeAvatar();
    expect(await prisma.attachment.findUniqueOrThrow({ where: { id: replacement.id } })).toMatchObject({ status: 2 });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({
      image: null,
      avatarAttachmentId: null,
    });
  });
});
