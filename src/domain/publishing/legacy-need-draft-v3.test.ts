import { describe, expect, it } from "vitest";

import {
  boardingSupplyKey,
  boardingSupplyOptions,
  countBoardingSupplyArrangements,
  mapLegacyNeedDraftV3,
  mapNeedDraftPayloadToLegacyNeedDraftV3,
  parseLegacyNeedDraftV3,
  type NeedDraftSnapshotV3,
} from "./legacy-need-draft-v3";
import { needPublishSchema } from "./contracts";

function draft(
  patch: Partial<NeedDraftSnapshotV3> = {},
): NeedDraftSnapshotV3 {
  return {
    version: 3,
    savedAt: Date.now(),
    currentId: "care",
    careType: null,
    pets: [],
    dates: { startDate: "", endDate: "", notes: "" },
    visitFrequency: "every-day",
    customInterval: 4,
    firstVisitDate: "",
    excludedVisitDates: [],
    visitsPerDay: 1,
    visitTimes: ["flexible"],
    exactTimes: [""],
    visitPlans: [],
    boardingRoutines: [],
    boardingSupplies: {},
    customBoardingSupplies: [],
    boardingSupplyNotes: "",
    supplyCostMode: "discuss",
    customPlans: [],
    taskNotes: "",
    boardingNeeds: [],
    customBoardingRequirements: [],
    boardingCompatibility: {},
    customHomeSituations: [],
    boardingHomeNotes: "",
    customNeeds: [],
    customWarnings: [],
    transport: "discuss",
    splitDirection: "owner-dropoff",
    distance: "5 km",
    area: "",
    location: { lat: 35.681236, lng: 139.767125 },
    areaConfirmed: false,
    budget: {
      currency: "JPY",
      mode: "exact",
      amount: "",
      maximum: "",
      exactNegotiable: false,
      travelMode: "none",
      travelAmount: "",
      supplyAmount: "",
    },
    visitedScreenIds: [],
    ...patch,
  };
}

const pet = {
  id: "pet-1",
  type: "cat",
  otherType: "",
  quantity: 1,
  name: "Mochi",
  breed: "Domestic shorthair",
  weight: "4.2",
  weightUnit: "kg" as const,
  birthDate: "2022-04-10",
  sex: "female",
  neutered: "yes",
  photo: "",
  notes: "Indoor cat",
};

describe("boarding supply suggestion profiles", () => {
  const labelsFor = (type: string, otherType = "") =>
    boardingSupplyOptions(
      [{ ...pet, id: `${type}:${otherType}`, type, otherType }],
      [],
    ).map((item) => item.label);

  it("shares the herbivore profile across rabbits, guinea pigs and chinchillas", () => {
    expect(labelsFor("rabbit")).toContain("Hay");
    expect(labelsFor("other", "Guinea pig")).toContain("Fresh vegetables");
    expect(labelsFor("other", "Chinchilla")).toContain("Chew toys or enrichment");
  });

  it("adds useful type-specific and reptile supplies", () => {
    expect(labelsFor("dog")).toContain("Leash and harness");
    expect(labelsFor("cat")).toContain("Scratching post or pad");
    expect(labelsFor("other", "Hamster")).toContain("Exercise wheel");
    expect(labelsFor("other", "Turtle")).toContain("Heat or UV lamp");
  });

  it("counts one shared arrangement for the same item assigned to two pets in a group", () => {
    const pets = [
      { ...pet, id: "rabbit-1", type: "rabbit", name: "Snowball" },
      { ...pet, id: "rabbit-2", type: "rabbit", name: "Huihui" },
    ];
    const options = boardingSupplyOptions(pets, []).filter(
      (item) => item.category === "food" && item.label === "Hay",
    );
    const plan = Object.fromEntries(
      options.map((item) => [item.key, "sitter"]),
    ) as Record<string, "sitter">;

    expect(
      countBoardingSupplyArrangements(pets, options, plan, "sitter"),
    ).toBe(1);
  });
});

describe("legacy need draft v3 migration", () => {
  it("maps an empty care description to null", () => {
    const result = mapLegacyNeedDraftV3(
      draft({ careType: "visit", taskNotes: "   " }),
      "Asia/Tokyo",
    );

    expect(result.payload.description).toBeNull();
  });

  it("publishes and restores date-step schedule notes independently", () => {
    const mapped = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        dates: {
          startDate: "2026-08-10",
          endDate: "2026-08-12",
          notes: "Building access starts after 18:00",
        },
        taskNotes: "Feed according to the task plan",
      }),
      "Asia/Tokyo",
    );

    expect(mapped.payload).toMatchObject({
      scheduleNotes: "Building access starts after 18:00",
      description: "Feed according to the task plan",
    });

    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "d9428888-122b-11e1-b85c-61cd3cbb3210",
      mode: "HOME_VISIT",
      payload: mapped.payload,
    });

    expect(restored.dates.notes).toBe("Building access starts after 18:00");
    expect(restored.taskNotes).toBe("Feed according to the task plan");
  });

  it("restores older server drafts whose task order was explicitly null", () => {
    const mapped = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        pets: [pet],
        dates: { startDate: "2026-08-10", endDate: "2026-08-12", notes: "" },
        visitPlans: [
          {
            id: "legacy-null-order",
            templateId: "feeding",
            label: "Feeding",
            priority: "must",
            petIds: ["pet-1"],
            visitNumbers: [1],
            custom: false,
          },
        ],
      }),
      "Asia/Tokyo",
    );
    const legacyPayload = structuredClone(mapped.payload);
    const legacyTask = legacyPayload.homeVisit?.tasks?.[0] as
      | Record<string, unknown>
      | undefined;
    if (!legacyTask) throw new Error("Expected mapped home-visit task");
    legacyTask.order = null;

    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "d9428888-122b-11e1-b85c-61cd3cbb3210",
      mode: "HOME_VISIT",
      payload: legacyPayload,
    });

    expect(restored.visitPlans[0].order).toBeUndefined();
  });

  it("round-trips standard task codes across all supported labels", () => {
    const base = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        pets: [pet],
        dates: { startDate: "2026-08-10", endDate: "2026-08-12", notes: "" },
        visitPlans: [
          {
            id: "task-standard",
            templateId: "feeding",
            label: "Feeding",
            priority: "must",
            petIds: ["pet-1"],
            visitNumbers: [1],
            custom: false,
          },
        ],
      }),
      "Asia/Tokyo",
    );

    for (const label of ["Feeding", "喂食", "給餌"]) {
      const payload = {
        ...base.payload,
        homeVisit: {
          ...base.payload.homeVisit!,
          tasks: [{ ...base.payload.homeVisit!.tasks![0], label }],
        },
      };
      const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
        draftId: "d9428888-122b-11e1-b85c-61cd3cbb3210",
        mode: "HOME_VISIT",
        payload,
      });
      expect(restored.visitPlans[0]).toMatchObject({
        templateId: "feeding",
        label: "feeding",
        custom: false,
      });
      const republished = mapLegacyNeedDraftV3(restored, "Asia/Tokyo");
      expect(republished.payload.homeVisit?.tasks?.[0]).toMatchObject({
        category: "FEEDING",
        label: "feeding",
      });
    }
  });

  it("keeps a custom label that happens to match a standard translation", () => {
    const mapped = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        pets: [pet],
        dates: { startDate: "2026-08-10", endDate: "2026-08-12", notes: "" },
        customPlans: [
          {
            id: "task-custom",
            templateId: "custom-task-custom",
            label: "Feeding",
            priority: "must",
            petIds: ["pet-1"],
            visitNumbers: [],
            custom: true,
          },
        ],
      }),
      "Asia/Tokyo",
    );
    expect(mapped.payload.custom?.tasks?.[0]).toMatchObject({
      category: "CUSTOM",
      label: "Feeding",
    });
    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "d9428888-122b-11e1-b85c-61cd3cbb3210",
      mode: "CUSTOM",
      payload: mapped.payload,
    });
    expect(restored.customPlans[0]).toMatchObject({
      custom: true,
      label: "Feeding",
    });
  });

  it("maps home visits, pets, task references and minor-unit money", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        pets: [pet],
        dates: { startDate: "2026-08-10", endDate: "2026-08-12", notes: "" },
        visitFrequency: "every-2-days",
        visitsPerDay: 2,
        visitTimes: ["exact", "flexible"],
        exactTimes: ["09:30", ""],
        visitPlans: [
          {
            id: "task-1",
            templateId: "feeding",
            label: "Feed Mochi",
            priority: "must",
            petIds: ["pet-1"],
            visitNumbers: [1, 2],
            custom: false,
          },
        ],
        budget: {
          currency: "USD",
          mode: "range",
          amount: "25.50",
          maximum: "40",
          exactNegotiable: true,
          travelMode: "fixed",
          travelAmount: "5.25",
          supplyAmount: "",
        },
      }),
      "Asia/Tokyo",
    );

    expect(result.mode).toBe("HOME_VISIT");
    expect(result.payload.pets?.[0]).toMatchObject({
      clientPetKey: "pet-1",
      petType: "CAT",
      quantity: 1,
      weightGrams: 4200,
    });
    expect(result.payload.budget).toMatchObject({
      minAmountMinor: 2550,
      maxAmountMinor: 4000,
      currency: "USD",
    });
    expect(result.payload.additionalCosts?.[0]).toMatchObject({
      amountMinor: 525,
    });
    expect(result.payload.homeVisit).toMatchObject({
      intervalDays: 2,
      visitsPerServiceDay: 2,
    });
    expect(result.payload.startsAt).toBe("2026-08-09T15:00:00.000Z");
    expect(result.payload.endsAt).toBe("2026-08-12T15:00:00.000Z");
  });

  it("round-trips the custom preferred time between draft and publish payload", () => {
    const mapped = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        pets: [pet],
        dates: {
          startDate: "2026-08-10",
          endDate: "2026-08-10",
          notes: "",
          timeOfDay: "exact",
          exactTime: "14:30",
        },
      }),
      "Asia/Tokyo",
    );

    expect(mapped.payload.custom).toMatchObject({
      timePreference: "EXACT",
      exactTime: "14:30",
    });

    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "d9428888-122b-11e1-b85c-61cd3cbb3210",
      mode: "CUSTOM",
      payload: mapped.payload,
    });

    expect(restored.dates).toMatchObject({
      startDate: "2026-08-10",
      endDate: "2026-08-10",
      timeOfDay: "exact",
      exactTime: "14:30",
    });
  });

  it("preserves a selected private pet profile reference", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        pets: [{ ...pet, sourcePetId: "saved-pet-1" }],
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.pets?.[0]).toMatchObject({
      clientPetKey: "pet-1",
      sourcePetId: "saved-pet-1",
      profileAction: "UPDATE",
    });
  });

  it("maps task source pet ids to the current draft client pet key", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        pets: [{ ...pet, sourcePetId: "saved-pet-1" }],
        visitPlans: [
          {
            id: "feeding-task",
            templateId: "feeding",
            label: "Feeding",
            priority: "must",
            petIds: ["saved-pet-1"],
            visitNumbers: [1],
            custom: false,
          },
        ],
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.homeVisit?.tasks?.[0]?.petKeys).toEqual(["pet-1"]);
  });

  it("preserves the pet profile save and sync choices", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        pets: [
          { ...pet, id: "temporary-pet", profileAction: "none" },
          {
            ...pet,
            id: "profile-copy",
            sourcePetId: "saved-pet-1",
            profileAction: "create",
          },
        ],
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.pets).toMatchObject([
      { clientPetKey: "temporary-pet", profileAction: "NONE" },
      {
        clientPetKey: "profile-copy",
        sourcePetId: "saved-pet-1",
        profileAction: "CREATE",
      },
    ]);
  });

  it("maps and validates a full custom care need publish payload", () => {
    const customDraft = draft({
      careType: "custom",
      pets: [pet],
      dates: {
        startDate: "2026-08-20",
        endDate: "2026-08-22",
        notes: "Some date notes",
        timeOfDay: "flexible",
        exactTime: "",
      },
      customPlans: [
        {
          id: "custom-task-1",
          templateId: "custom-1",
          label: "Pet transport",
          priority: "must",
          petIds: ["pet-1"],
          visitNumbers: [],
          custom: false,
          notes: "Task notes",
          order: 0,
        },
      ],
      customNeeds: ["Need experience"],
      customWarnings: ["Shy pet"],
      taskNotes: "General requirements notes",
      areaConfirmed: true,
      area: "Tokyo",
      location: {
        lat: 35.681236,
        lng: 139.767125,
        regionLabel: "Tokyo, Japan",
      },
      budget: {
        currency: "JPY",
        mode: "exact",
        amount: "5000",
        maximum: "",
        exactNegotiable: true,
        travelMode: "none",
        travelAmount: "",
        supplyAmount: "",
      },
    });

    const mapped = mapLegacyNeedDraftV3(customDraft, "Asia/Tokyo");
    expect(mapped.mode).toBe("CUSTOM");

    const input = {
      ...mapped.payload,
      schemaVersion: 1,
      draftId: "123e4567-e89b-12d3-a456-426614174000",
      revision: 1,
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174001",
      mode: mapped.mode!,
    };

    const parsed = needPublishSchema.safeParse(input);
    if (!parsed.success) {
      console.log("Validation errors:", JSON.stringify(parsed.error.issues, null, 2));
    }
    expect(parsed.success).toBe(true);
  });

  it("sanitizes bloated clientTaskKeys that exceed 80 characters", () => {
    const customDraft = draft({
      careType: "custom",
      pets: [pet],
      customPlans: [
        {
          id: "custom-task-123e4567-e89b-12d3-a456-426614174000:pet-1:pet-1:pet-1:pet-1:pet-1:pet-1:pet-1:pet-1:pet-1",
          templateId: "custom-1",
          label: "Pet transport",
          priority: "must",
          petIds: ["pet-1"],
          visitNumbers: [],
          custom: false,
          notes: "Task notes",
          order: 0,
        },
      ],
      areaConfirmed: true,
      area: "Tokyo",
      location: {
        lat: 35.681236,
        lng: 139.767125,
        label: "Tokyo",
      },
    });

    const mapped = mapLegacyNeedDraftV3(customDraft, "Asia/Tokyo");
    const taskKey = mapped.payload.custom?.tasks?.[0]?.clientTaskKey;
    expect(taskKey).toBeDefined();
    expect(taskKey!.length).toBeLessThanOrEqual(80);
    expect(taskKey).toBe("custom-task-123e4567-e89b-12d3-a456-426614174000:pet-1");
  });

  it("carries the confirmed search-box text as the saved location label", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        areaConfirmed: true,
        area: "legacy user-entered location text",
        location: {
          lat: 35.681236,
          lng: 139.767125,
          label: "legacy user-entered location text",
        },
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.location).toEqual({
      lat: 35.681236,
      lon: 139.767125,
      label: "legacy user-entered location text",
      regionLabel: null,
      displayPrecision: "MAP_POINT",
    });
    expect(JSON.stringify(result.payload)).toContain("legacy user-entered");
  });

  it("preserves a selected saved map location and its display label", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        areaConfirmed: true,
        area: "profile display label",
        location: {
          sourceLocationId: "saved-location-1",
          lat: 35.681236,
          lng: 139.767125,
          label: "profile display label",
        },
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.location).toEqual({
      sourceLocationId: "saved-location-1",
      lat: 35.681236,
      lon: 139.767125,
      label: "profile display label",
      regionLabel: null,
      displayPrecision: "MAP_POINT",
    });
    expect(JSON.stringify(result.payload)).toContain("profile display label");
  });

  it("maps completed supporting uploads to attachment IDs", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        attachments: [
          { id: "attachment-1", url: "/uploads/one.jpg", signature: "sig-1" },
          { id: "attachment-2", url: "/uploads/two.jpg", signature: "sig-2" },
        ],
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.attachmentIds).toEqual([
      "attachment-1",
      "attachment-2",
    ]);
  });

  it("round-trips a persisted home-visit payload through an edit draft", () => {
    const original = draft({
      careType: "visit",
      pets: [
        {
          ...pet,
          sourcePetId: "saved-pet-1",
          photoAttachmentId: "pet-photo-1",
          photo: "/uploads/mochi.jpg",
        },
      ],
      dates: { startDate: "2026-08-10", endDate: "2026-08-12", notes: "" },
      visitFrequency: "every-2-days",
      firstVisitDate: "2026-08-10",
      visitsPerDay: 1,
      visitTimes: ["exact"],
      exactTimes: ["09:30"],
      visitPlans: [
        {
          id: "task-1",
          templateId: "feeding",
          label: "Feed Mochi",
          priority: "must",
          petIds: ["pet-1"],
          visitNumbers: [1],
          custom: false,
          notes: "Measured portion",
          order: 0,
        },
      ],
      areaConfirmed: true,
      location: {
        sourceLocationId: "saved-location-1",
        displayPrecision: "NEIGHBORHOOD",
        lat: 35.68,
        lng: 139.76,
      },
      budget: {
        currency: "JPY",
        mode: "exact",
        amount: "8000",
        maximum: "",
        exactNegotiable: false,
        travelMode: "fixed",
        travelAmount: "500",
        supplyAmount: "",
      },
      attachments: [
        { id: "attachment-1", url: "/uploads/one.jpg", signature: "sig-1" },
      ],
    });
    const published = mapLegacyNeedDraftV3(original, "Asia/Tokyo");
    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "11111111-1111-4111-8111-111111111111",
      mode: "HOME_VISIT",
      payload: published.payload,
      attachments: original.attachments,
    });
    const republished = mapLegacyNeedDraftV3(restored, "Asia/Tokyo");

    expect(restored.pets[0]).toMatchObject({
      photoAttachmentId: "pet-photo-1",
      photo: "/uploads/mochi.jpg",
      profileAction: "update",
    });
    expect(republished).toEqual(published);
  });

  it("round-trips a persisted boarding payload through an edit draft", () => {
    const customSupplyKey = "custom:heated-pad";
    const original = draft({
      careType: "boarding",
      pets: [{ ...pet, sourcePetId: "saved-pet-1" }],
      dates: { startDate: "2026-08-10", endDate: "2026-08-12", notes: "" },
      boardingRoutines: [
        {
          templateId: "medication",
          label: "Medication",
          custom: false,
          routines: [
            {
              id: "routine-1",
              petIds: ["pet-1"],
              priority: "must",
              scheduleType: "repeating",
              instructions: "With food",
              order: 0,
            },
          ],
        },
      ],
      boardingSupplies: {
        [boardingSupplyKey("pet-1", "food", "Dry food")]: "owner",
        [customSupplyKey]: "sitter",
      },
      customBoardingSupplies: [
        {
          id: "heated-pad",
          petId: "pet-1",
          category: "stay",
          label: "Heated sleeping pad",
        },
      ],
      boardingSupplyNotes:
        "Food is packed by day; return unused supplies at pickup",
      supplyCostMode: "fixed",
      boardingNeeds: ["Quiet environment", "No stairs"],
      customBoardingRequirements: ["No stairs"],
      boardingCompatibility: {
        "Dogs in the home": "not-ok",
        "Open-plan kitchen": "not-ok",
      },
      customHomeSituations: ["Open-plan kitchen"],
      boardingHomeNotes: "Keep windows secured",
      taskNotes: "Call if appetite changes",
      transport: "split",
      distance: "10 km",
      areaConfirmed: true,
      location: { lat: 35.68, lng: 139.76 },
      budget: {
        currency: "JPY",
        mode: "range",
        amount: "12000",
        maximum: "16000",
        exactNegotiable: true,
        travelMode: "fixed",
        travelAmount: "1000",
        supplyAmount: "800",
      },
    });
    const published = mapLegacyNeedDraftV3(original, "Asia/Tokyo");
    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "22222222-2222-4222-8222-222222222222",
      mode: "BOARDING",
      payload: published.payload,
    });
    const republished = mapLegacyNeedDraftV3(restored, "Asia/Tokyo");

    expect(published.payload.endsAt).toBe("2026-08-11T15:00:00.000Z");
    expect(restored.dates.endDate).toBe("2026-08-12");
    expect(republished).toEqual(published);
    expect(restored.customBoardingRequirements).toEqual(["No stairs"]);
    expect(restored.customHomeSituations).toEqual(["Open-plan kitchen"]);
    expect(restored.boardingSupplyNotes).toBe(
      "Food is packed by day; return unused supplies at pickup",
    );
  });

  it("round-trips a persisted custom-care payload through an edit draft", () => {
    const original = draft({
      careType: "custom",
      pets: [{ ...pet, sourcePetId: "saved-pet-1" }],
      dates: { startDate: "2026-08-10", endDate: "2026-08-10", notes: "" },
      customPlans: [
        {
          id: "task-1",
          templateId: "transport",
          label: "Vet transport",
          priority: "must",
          petIds: ["pet-1"],
          visitNumbers: [],
          custom: false,
          notes: "Use the carrier",
          order: 0,
        },
      ],
      taskNotes: "Appointment at 10:00",
      customNeeds: ["Pet-friendly vehicle"],
      customWarnings: ["Nervous around strangers"],
      areaConfirmed: true,
      location: { lat: 35.68, lng: 139.76 },
      budget: {
        currency: "USD",
        mode: "open",
        amount: "",
        maximum: "",
        exactNegotiable: true,
        travelMode: "none",
        travelAmount: "",
        supplyAmount: "",
      },
    });
    const published = mapLegacyNeedDraftV3(original, "Asia/Tokyo");
    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "33333333-3333-4333-8333-333333333333",
      mode: "CUSTOM",
      payload: published.payload,
    });
    const republished = mapLegacyNeedDraftV3(restored, "Asia/Tokyo");

    expect(republished).toEqual(published);
  });

  it("maps boarding routines and requires legacy capacity to be supplied later", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "boarding",
        pets: [pet],
        boardingRoutines: [
          {
            templateId: "medication",
            label: "Medication",
            custom: false,
            routines: [
              {
                id: "routine-1",
                petIds: ["pet-1"],
                priority: "must",
                scheduleType: "repeating",
                instructions: "With food",
                order: 0,
              },
            ],
          },
        ],
        transport: "sitter",
        distance: "10 km",
      }),
      "Asia/Tokyo",
    );

    expect(result.mode).toBe("BOARDING");
    expect(result.payload.boarding).toMatchObject({
      transportMode: "PROVIDER",
      maxProviderDistanceMeters: 10_000,
    });
    expect(result.payload.boarding?.tasks?.[0]).toMatchObject({
      scheduleKind: "REPEATING",
      priority: null,
    });
  });

  it("maps home-visit tasks with null scheduleKind while preserving priority and visit numbers", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        pets: [pet],
        visitPlans: [
          {
            id: "task-feed",
            templateId: "feeding",
            label: "Feed cat",
            priority: "must",
            petIds: ["pet-1"],
            visitNumbers: [1, 2],
            custom: false,
            notes: "1 can wet food",
            order: 0,
          },
        ],
      }),
      "Asia/Tokyo",
    );

    expect(result.mode).toBe("HOME_VISIT");
    expect(result.payload.homeVisit?.tasks?.[0]).toMatchObject({
      scheduleKind: null,
      priority: "MUST",
      visitNumbers: [1, 2],
    });
  });

  it("round-trips independent order for each shared home visit task", () => {
    const mapped = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        pets: [pet],
        dates: { startDate: "2026-08-10", endDate: "2026-08-12", notes: "" },
        visitsPerDay: 2,
        visitPlans: [
          {
            id: "task-feed",
            templateId: "feeding",
            label: "Feed cat",
            priority: "must",
            petIds: ["pet-1"],
            visitNumbers: [1, 2],
            custom: false,
            order: 0,
            orderByVisit: { 1: 1, 2: 0 },
          },
        ],
      }),
      "Asia/Tokyo",
    );

    expect(mapped.payload.homeVisit?.tasks?.[0].orderByVisit).toEqual({
      1: 1,
      2: 0,
    });

    const restored = mapNeedDraftPayloadToLegacyNeedDraftV3({
      draftId: "d9428888-122b-11e1-b85c-61cd3cbb3210",
      mode: "HOME_VISIT",
      payload: mapped.payload,
    });
    expect(restored.visitPlans[0].orderByVisit).toEqual({ 1: 1, 2: 0 });

    const republished = mapLegacyNeedDraftV3(restored, "Asia/Tokyo");
    expect(republished.payload.homeVisit?.tasks?.[0].orderByVisit).toEqual({
      1: 1,
      2: 0,
    });
  });

  it("preserves standard and custom boarding supplies, costs and split transport", () => {
    const dryFoodKey = boardingSupplyKey("pet-1", "food", "Dry food");
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "boarding",
        pets: [pet],
        boardingSupplies: {
          [dryFoodKey]: "owner",
          "custom:supply-1": "sitter",
        },
        customBoardingSupplies: [
          {
            id: "supply-1",
            petId: "pet-1",
            category: "stay",
            label: "Heated sleeping pad",
          },
        ],
        supplyCostMode: "fixed",
        transport: "split",
        splitDirection: "owner-dropoff",
        budget: {
          currency: "USD",
          mode: "open",
          amount: "",
          maximum: "",
          exactNegotiable: true,
          travelMode: "actual",
          travelAmount: "",
          supplyAmount: "12.75",
        },
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.boarding?.supplies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientSupplyKey: dryFoodKey,
          providedBy: "OWNER",
        }),
        expect.objectContaining({
          clientSupplyKey: "custom:supply-1",
          label: "Heated sleeping pad",
          providedBy: "PROVIDER",
        }),
      ]),
    );
    expect(result.payload.boarding).toMatchObject({
      transportMode: "PROVIDER",
      handoffDirection: "SPLIT",
    });
    expect(result.payload.additionalCosts).toContainEqual({
      kind: "SUPPLY",
      mode: "FIXED",
      amountMinor: 1275,
    });
  });

  it("keeps boarding fit details separate from custom needs and warnings", () => {
    const boarding = mapLegacyNeedDraftV3(
      draft({
        careType: "boarding",
        boardingNeeds: ["Secure windows", "Secure windows"],
        boardingCompatibility: {
          "Unsupervised garden access": "not-ok",
        },
        boardingHomeNotes: "No direct contact with other pets",
        customWarnings: ["This belongs to custom mode"],
      }),
      "Asia/Tokyo",
    );

    expect(boarding.payload.boarding?.requirements).toEqual([
      {
        kind: "ENVIRONMENT_REQUIRED",
        label: "Secure windows",
        petKey: null,
      },
      {
        kind: "UNACCEPTABLE",
        label: "Unsupervised garden access",
        petKey: null,
      },
      {
        kind: "NOTE",
        label: "No direct contact with other pets",
        petKey: null,
      },
    ]);

    const custom = mapLegacyNeedDraftV3(
      draft({
        careType: "custom",
        customNeeds: ["Quiet handling"],
        customWarnings: ["Do not use a retractable leash"],
        customRequirementsNotes: "Meet at the side entrance",
      }),
      "Asia/Tokyo",
    );
    expect(custom.payload.custom?.requirements).toEqual([
      { kind: "OTHER_NEED", label: "Quiet handling", petKey: null },
      {
        kind: "WARNING",
        label: "Do not use a retractable leash",
        petKey: null,
      },
      {
        kind: "NOTE",
        label: "Meet at the side entrance",
        petKey: null,
      },
    ]);
  });

  it("accepts incomplete legacy drafts without inventing missing values", () => {
    const result = mapLegacyNeedDraftV3(
      draft({
        careType: "visit",
        pets: [{ ...pet, name: "", weight: "" }],
        budget: {
          currency: "JPY",
          mode: "exact",
          amount: "",
          maximum: "",
          exactNegotiable: false,
          travelMode: "fixed",
          travelAmount: "",
          supplyAmount: "",
        },
      }),
      "Asia/Tokyo",
    );

    expect(result.payload.pets?.[0]?.name).toBeUndefined();
    expect(result.payload.budget?.minAmountMinor).toBeNull();
    expect(result.payload.additionalCosts?.[0]?.amountMinor).toBeNull();
  });

  it("rejects damaged or shape-incompatible local drafts before hydration", () => {
    expect(parseLegacyNeedDraftV3({ ...draft(), pets: "not-an-array" })).toBeNull();
    expect(
      parseLegacyNeedDraftV3({
        ...draft(),
        serverDraftId: 123 as any,
      }),
    ).toBeNull();
    expect(parseLegacyNeedDraftV3(draft())).not.toBeNull();
  });
});
