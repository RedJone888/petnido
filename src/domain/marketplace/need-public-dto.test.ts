import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { PublicNeedV2Source } from "./need-public-dto";
import { toPublicNeedV2Dto } from "./need-public-dto";

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
    ownerId: "owner-1",
    mode: "HOME_VISIT",
    state: "OPEN",
    description: "Public description",
    scheduleNotes: "Access after 18:00",
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
    sourceDraft: null,
    owner,
    locationSnapshot: {
      id: "private-location-id",
      sourceLocationId: "private-saved-location",
      lat: new Prisma.Decimal("35.681236"),
      lon: new Prisma.Decimal("139.767125"),
      label: "Tokyo Station, Marunouchi, Chiyoda, Tokyo, Japan",
      regionLabel: "Chiyoda, Tokyo",
      displayPrecision: "DISTRICT",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    },
    pets: [{
      id: "pet-snapshot-1",
      order: 0,
      name: "Mochi",
      petType: "CAT",
      customPetType: null,
      quantity: 2,
      breed: "Ragdoll",
      birthDate: null,
      weightGrams: null,
      sex: "MALE",
      neutered: "YES",
      careNotes: null,
      attachments: [{ attachment: { url: "/mochi.jpg" } }],
      sourcePet: {
        breed: "Ragdoll",
        birthDate: null,
        weightGrams: null,
        sex: "MALE",
        neutered: "YES",
        notes: null,
      },
    }],
    tasks: [{
      id: "task-1",
      category: "FEEDING",
      label: "Feed dinner",
      instructions: null,
      priority: "MUST",
      scheduleKind: "EACH_VISIT",
      visitNumbers: [1],
      order: 0,
      visitOrders: [{
        id: "visit-order-1",
        needId: "need-1",
        taskId: "task-1",
        visitNumber: 1,
        order: 3,
      }],
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
  it("returns the persisted full label and public region as separate fields", () => {
    const dto = toPublicNeedV2Dto(v2Fixture(), null);
    expect(dto.location.label).toBe(
      "Tokyo Station, Marunouchi, Chiyoda, Tokyo, Japan",
    );
    expect(dto.location.regionLabel).toBe("Chiyoda, Tokyo");
  });

  it("shows safe discovery fields while excluding exact location and care snapshots", () => {
    const dto = toPublicNeedV2Dto(v2Fixture(), 1250);
    expect(dto).toMatchObject({
      publicId: "v2:need-1",
      scheduleNotes: "Access after 18:00",
      location: {
        label: "Tokyo Station, Marunouchi, Chiyoda, Tokyo, Japan",
        regionLabel: "Chiyoda, Tokyo",
        displayPrecision: "DISTRICT",
        distanceMeters: 1250,
        mapPoint: { lat: 35.681236, lon: 139.767125 },
      },
      title: "Mochi · Feeding",
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
          orderByVisit: { 1: 3 },
          pets: [],
        },
      ],
      budget: { minAmountMinor: 8000 },
      attachments: [{ id: "photo-1", url: "/care.jpg" }],
    });
    expect(dto.schedule.homeVisit).not.toHaveProperty("excludedDates");
    const serialized = JSON.stringify(dto);
    for (const privateValue of [
      "private-idempotency",
      "private-location-id",
      "private-saved-location",
      "sourcePetId",
    ]) expect(serialized).not.toContain(privateValue);
  });

  it("derives the V2 title from the current snapshot instead of a stored title", () => {
    const dto = toPublicNeedV2Dto(
      {
        ...v2Fixture(),
        mode: "BOARDING",
        pets: [
          {
            ...v2Fixture().pets[0],
            name: "",
            petType: "OTHER",
            customPetType: "Sugar glider",
          },
        ],
      },
      null,
    );

    expect(dto.title).toBe("2 Sugar gliders · Feeding");
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

  it("restores a legacy custom requirements note from its publishing workspace", () => {
    const dto = toPublicNeedV2Dto(
      {
        ...v2Fixture(),
        mode: "CUSTOM",
        sourceDraft: {
          payloadJson: JSON.stringify({
            workspace: {
              draftByMode: {
                custom: { customRequirementsNotes: "Use the side entrance" },
              },
            },
          }),
        },
        requirements: [
          {
            id: "requirement-1",
            kind: "OTHER_NEED",
            label: "Medication experience",
            pet: null,
          },
          {
            id: "requirement-2",
            kind: "OTHER_NEED",
            label: "Use the side entrance",
            pet: null,
          },
        ],
      },
      null,
    );

    expect(dto.requirements).toEqual([
      expect.objectContaining({
        label: "Medication experience",
        kind: "OTHER_NEED",
      }),
      expect.objectContaining({
        label: "Use the side entrance",
        kind: "NOTE",
      }),
    ]);
    expect(JSON.stringify(dto)).not.toContain("draftByMode");
  });
});
