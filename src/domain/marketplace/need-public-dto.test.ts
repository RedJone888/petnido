import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { PublicLegacyNeedSource, PublicNeedV2Source } from "./need-public-dto";
import { toPublicLegacyNeedDto, toPublicNeedV2Dto } from "./need-public-dto";

const owner = {
  id: "owner-1",
  name: "Mika",
  image: "/avatar.jpg",
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  profile: { bio: "Pet owner" },
  _count: { needs: 2, needsV2: 1 },
};

function v2Fixture(): PublicNeedV2Source {
  return {
    id: "need-1",
    idempotencyKey: "private-idempotency",
    legacyNeedId: null,
    ownerId: "owner-1",
    mode: "HOME_VISIT",
    state: "OPEN",
    title: "Care for two cats",
    description: "Public description",
    startsAt: new Date("2026-08-10T00:00:00.000Z"),
    endsAt: new Date("2026-08-12T00:00:00.000Z"),
    timeZone: "Asia/Tokyo",
    customTimePreference: null,
    customExactTime: null,
    locationSnapshotId: "private-location-id",
    budgetKind: "EXACT",
    minAmountMinor: 8000n,
    maxAmountMinor: null,
    currency: "JPY",
    negotiable: false,
    archivedAt: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    owner,
    locationSnapshot: {
      id: "private-location-id",
      sourceLocationId: "private-saved-location",
      lat: new Prisma.Decimal("35.681236"),
      lon: new Prisma.Decimal("139.767125"),
      regionLabel: "Chiyoda, Tokyo",
      displayPrecision: "DISTRICT",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    },
    pets: [{
      name: "Mochi",
      petType: "CAT",
      quantity: 2,
      breed: "Ragdoll",
      birthDate: null,
      weightGrams: null,
      sex: "MALE",
      neutered: "YES",
      careNotes: null,
      sourcePet: {
        breed: "Ragdoll",
        birthDate: null,
        weightGrams: null,
        sex: "MALE",
        neutered: "YES",
        notes: null,
        photos: [{ url: "/mochi.jpg" }],
      },
    }],
    tasks: [{
      category: "FEEDING",
      label: "Feed dinner",
      instructions: null,
      priority: "MUST",
      scheduleKind: "EACH_VISIT",
      visitNumbers: [1],
      petLinks: [],
    }],
    homeVisitDetail: {
      id: "home-1",
      needId: "need-1",
      intervalDays: 1,
      firstServiceDate: new Date("2026-08-10T00:00:00.000Z"),
      visitsPerServiceDay: 1,
    },
    boardingDetail: null,
    visitWindows: [{ id: "window-1", needId: "need-1", visitNumber: 1, kind: "PREFERRED", preferredLocalTime: "18:00" }],
    dateExceptions: [],
    supplies: [],
    requirements: [],
    additionalCosts: [],
    attachments: [{
      needId: "need-1",
      attachmentId: "photo-1",
      purpose: "GENERAL",
      order: 0,
      attachment: { id: "photo-1", url: "/care.jpg" },
    }],
  };
}

describe("public need DTO", () => {
  it("shows safe discovery fields while excluding exact location and care snapshots", () => {
    const dto = toPublicNeedV2Dto(v2Fixture(), 1250);
    expect(dto).toMatchObject({
      publicId: "v2:need-1",
      location: {
        regionLabel: "Chiyoda, Tokyo",
        displayPrecision: "DISTRICT",
        distanceMeters: 1250,
        mapPoint: { lat: 35.681236, lon: 139.767125 },
      },
      pets: [
        {
          name: "Mochi",
          petType: "CAT",
          quantity: 2,
          breed: "Ragdoll",
          birthDate: null,
          weightGrams: null,
          sex: "MALE",
          neutered: "YES",
          careNotes: null,
          image: "/mochi.jpg",
        },
      ],
      tasks: [
        {
          category: "FEEDING",
          label: "Feed dinner",
          instructions: null,
          priority: "MUST",
          scheduleKind: "EACH_VISIT",
          visitNumbers: [1],
          pets: [],
        },
      ],
      budget: { minAmountMinor: 8000 },
      attachments: [{ id: "photo-1", url: "/care.jpg" }],
    });
    const serialized = JSON.stringify(dto);
    for (const privateValue of [
      "private-idempotency",
      "private-location-id",
      "private-saved-location",
      "sourcePetId",
    ]) expect(serialized).not.toContain(privateValue);
  });

  it("normalizes legacy display amounts to minor units without exposing raw address text", () => {
    const legacy = {
      id: "legacy-1",
      ownerId: "owner-1",
      title: "Legacy care",
      category: "OTHER",
      requirement: "Vet transport",
      startDate: new Date("2026-08-10T00:00:00.000Z"),
      endDate: new Date("2026-08-11T00:00:00.000Z"),
      frequencyType: null,
      customDays: null,
      customTimes: null,
      addressRaw: "must never be returned",
      addressLat: 35.68,
      addressLon: 139.76,
      currency: "USD",
      fosterRange: null,
      transportMethod: null,
      status: "OPEN",
      priceAmount: null,
      totalPrice: 12.5,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-02T00:00:00.000Z"),
      archivedAt: null,
      owner,
      photos: [],
      needPets: [{ petCategory: "CAT", petType: null, count: 1, tags: [], photos: [] }],
    } as unknown as PublicLegacyNeedSource;
    const dto = toPublicLegacyNeedDto(legacy, null);
    expect(dto.budget.minAmountMinor).toBe(1250);
    expect(dto.location.mapPoint).toEqual({ lat: 35.68, lon: 139.76 });
    expect(JSON.stringify(dto)).not.toContain("must never be returned");
  });

  it("exposes a custom need preferred time in the schedule", () => {
    const dto = toPublicNeedV2Dto(
      {
        ...v2Fixture(),
        mode: "CUSTOM",
        customTimePreference: "MORNING",
        customExactTime: null,
      },
      100,
    );

    expect(dto.schedule.custom).toEqual({
      timePreference: "MORNING",
      exactTime: null,
    });
  });
});
