import { describe, expect, it } from "vitest";

import {
  mapLocationInputSchema,
  moneyInputSchema,
  needPublishSchema,
  publishDraftEnvelopeSchema,
  servicePublishSchema,
} from "./contracts";

const location = {
  lat: 35.681236,
  lon: 139.767125,
  regionLabel: "Chiyoda, Tokyo",
  displayPrecision: "DISTRICT" as const,
};

const pet = {
  clientPetKey: "pet-1",
  sourcePetId: null,
  name: "Mochi",
  petType: "CAT",
  breed: null,
  birthDate: null,
  weightGrams: null,
  sex: "UNKNOWN" as const,
  neutered: "UNKNOWN" as const,
  careNotes: null,
};

const task = {
  clientTaskKey: "task-1",
  category: "FEEDING",
  label: "Feed dinner",
  instructions: null,
  priority: "MUST" as const,
  petKeys: ["pet-1"],
  scheduleKind: "EACH_VISIT" as const,
  visitNumbers: [1],
  order: 0,
};

const commonNeed = {
  schemaVersion: 1 as const,
  draftId: "draft-1",
  revision: 2,
  idempotencyKey: "d9428888-122b-11e1-b85c-61cd3cbb3210",
  description: null,
  scheduleNotes: null,
  startsAt: "2026-08-10T00:00:00+09:00",
  endsAt: "2026-08-12T00:00:00+09:00",
  timeZone: "Asia/Tokyo",
  pets: [pet],
  location,
  budget: {
    kind: "EXACT" as const,
    minAmountMinor: 8_000,
    maxAmountMinor: null,
    currency: "JPY" as const,
    negotiable: false,
  },
  additionalCosts: [
    { kind: "TRAVEL" as const, mode: "NONE" as const, amountMinor: null },
  ],
};

const commonService = {
  schemaVersion: 1 as const,
  draftId: "service-draft-1",
  revision: 0,
  idempotencyKey: "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  title: "Calm cat care",
  description: null,
  timeZone: "Asia/Tokyo",
  location,
  currency: "JPY" as const,
  availabilityRules: [
    {
      kind: "WEEKLY" as const,
      weekdays: [1, 2, 3, 4, 5],
      startsOn: null,
      endsOn: null,
      includesHolidays: false,
    },
  ],
  availabilityExceptions: [],
  petPolicies: [
    {
      petType: "CAT",
      size: "ANY" as const,
      ageBand: "ANY" as const,
      accepted: true,
      notes: null,
    },
  ],
  offerings: [{ category: "FEEDING", label: "Feeding", description: null }],
  priceRules: [{ label: "Per visit", unit: "VISIT" as const, amountMinor: 3_000 }],
  discounts: [],
  attachmentIds: [],
};

describe("publishing contracts", () => {
  it("rejects precise-address fields at the location boundary", () => {
    const forbiddenLocationKey = ["address", "Raw"].join("");
    expect(
      mapLocationInputSchema.safeParse({
        ...location,
        [forbiddenLocationKey]: "1-2-3 Example",
      }).success,
    ).toBe(false);
    expect(
      mapLocationInputSchema.safeParse({
        ...location,
        displayPrecision: "NEIGHBORHOOD",
      }).success,
    ).toBe(true);
  });

  it("enforces exact, range, and open money shapes", () => {
    expect(
      moneyInputSchema.safeParse({
        kind: "RANGE",
        minAmountMinor: 9_000,
        maxAmountMinor: 8_000,
        currency: "JPY",
        negotiable: false,
      }).success,
    ).toBe(false);
    expect(
      moneyInputSchema.safeParse({
        kind: "OPEN",
        minAmountMinor: null,
        maxAmountMinor: null,
        currency: "JPY",
        negotiable: true,
      }).success,
    ).toBe(true);
  });

  it("accepts a complete home-visit need and validates task references", () => {
    const input = {
      ...commonNeed,
      mode: "HOME_VISIT" as const,
      homeVisit: {
        intervalDays: 1,
        firstServiceDate: "2026-08-10",
        visitsPerServiceDay: 1,
        visitWindows: [
          { visitNumber: 1, kind: "FLEXIBLE" as const, preferredLocalTime: null },
        ],
        tasks: [task],
      },
    };
    expect(needPublishSchema.safeParse(input).success).toBe(true);
    expect(needPublishSchema.parse(input).attachmentIds).toEqual([]);
    expect(
      needPublishSchema.safeParse({
        ...input,
        homeVisit: { ...input.homeVisit, excludedDates: [] },
      }).success,
    ).toBe(false);
    expect(
      needPublishSchema.safeParse({
        ...input,
        homeVisit: {
          ...input.homeVisit,
          tasks: [{ ...task, petKeys: ["missing-pet"] }],
        },
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate task, cost, source-pet and boarding supply keys", () => {
    const base = {
      ...commonNeed,
      pets: [
        { ...pet, sourcePetId: "saved-pet", clientPetKey: "pet-1" },
        { ...pet, sourcePetId: "saved-pet", clientPetKey: "pet-2" },
      ],
      additionalCosts: [
        { kind: "TRAVEL" as const, mode: "NONE" as const, amountMinor: null },
        { kind: "TRAVEL" as const, mode: "DISCUSS" as const, amountMinor: null },
      ],
      mode: "BOARDING" as const,
      boarding: {
        tasks: [
          { ...task, scheduleKind: "DAILY" as const, visitNumbers: [] },
          { ...task, scheduleKind: "DAILY" as const, visitNumbers: [] },
        ],
        supplies: [
          {
            clientSupplyKey: "supply-1",
            petKey: null,
            category: "FOOD" as const,
            label: "Food",
            providedBy: "OWNER" as const,
          },
          {
            clientSupplyKey: "supply-1",
            petKey: null,
            category: "STAY" as const,
            label: "Bed",
            providedBy: "OWNER" as const,
          },
        ],
        requirements: [],
        transportMode: "OWNER" as const,
        handoffDirection: "OWNER_DROPOFF" as const,
        maxProviderDistanceMeters: null,
      },
    };
    expect(needPublishSchema.safeParse(base).success).toBe(false);
  });

  it("publishes undated once-during-stay and note-free as-needed boarding tasks", () => {
    const input = {
      ...commonNeed,
      mode: "BOARDING" as const,
      boarding: {
        tasks: [
          {
            ...task,
            clientTaskKey: "task-once",
            scheduleKind: "ONCE" as const,
            visitNumbers: [],
          },
          {
            ...task,
            clientTaskKey: "task-as-needed",
            scheduleKind: "AS_NEEDED" as const,
            visitNumbers: [],
          },
        ],
        supplies: [],
        requirements: [],
        transportMode: "DISCUSS" as const,
        handoffDirection: "DISCUSS" as const,
        maxProviderDistanceMeters: null,
      },
    };

    expect(needPublishSchema.safeParse(input).success).toBe(true);
  });

  it("accepts a preferred time on custom needs and requires an exact time when EXACT", () => {
    const base = {
      ...commonNeed,
      mode: "CUSTOM" as const,
      custom: {
        tasks: [{ ...task, scheduleKind: "DAILY" as const, visitNumbers: [] }],
        requirements: [],
      },
    };
    expect(
      needPublishSchema.safeParse({
        ...base,
        custom: { ...base.custom, timePreference: "MORNING" as const },
      }).success,
    ).toBe(true);
    expect(
      needPublishSchema.safeParse({
        ...base,
        custom: {
          ...base.custom,
          timePreference: "EXACT" as const,
          exactTime: "14:30",
        },
      }).success,
    ).toBe(true);
    expect(
      needPublishSchema.safeParse({
        ...base,
        custom: { ...base.custom, timePreference: "EXACT" as const },
      }).success,
    ).toBe(false);
  });

  it("rejects expired ordering and out-of-range visit references", () => {
    const input = {
      ...commonNeed,
      startsAt: commonNeed.endsAt,
      endsAt: commonNeed.startsAt,
      mode: "HOME_VISIT" as const,
      homeVisit: {
        intervalDays: 1,
        firstServiceDate: "2026-08-10",
        visitsPerServiceDay: 1,
        visitWindows: [
          { visitNumber: 1, kind: "FLEXIBLE" as const, preferredLocalTime: null },
        ],
        tasks: [{ ...task, visitNumbers: [2] }],
      },
    };
    expect(needPublishSchema.safeParse(input).success).toBe(false);
  });

  it("treats the need end instant as exclusive for the first visit", () => {
    const input = {
      ...commonNeed,
      mode: "HOME_VISIT" as const,
      homeVisit: {
        intervalDays: 1,
        firstServiceDate: "2026-08-12",
        visitsPerServiceDay: 1,
        visitWindows: [
          { visitNumber: 1, kind: "FLEXIBLE" as const, preferredLocalTime: null },
        ],
        tasks: [task],
      },
    };

    expect(needPublishSchema.safeParse(input).success).toBe(false);
  });

  it("accepts typed requirements for a custom need", () => {
    expect(
      needPublishSchema.safeParse({
        ...commonNeed,
        mode: "CUSTOM",
        custom: {
          tasks: [{ ...task, scheduleKind: "DAILY", visitNumbers: [] }],
          requirements: [
            {
              kind: "WARNING",
              label: "Do not use a retractable leash",
              petKey: null,
            },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it("requires pet capacity only through the boarding service branch", () => {
    expect(
      servicePublishSchema.safeParse({
        ...commonService,
        mode: "BOARDING",
        boarding: {
          maxPetCapacity: 3,
          environmentDescription: "Quiet room with secure windows",
          residentPetNotes: null,
          suppliedItems: ["Water bowls"],
        },
      }).success,
    ).toBe(true);
    expect(
      servicePublishSchema.safeParse({
        ...commonService,
        mode: "HOME_VISIT",
        homeVisit: { serviceRadiusMeters: 5_000 },
        maxPetCapacity: 3,
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate service policies, exceptions, attachments and invalid percent discounts", () => {
    const input = {
      ...commonService,
      mode: "CUSTOM" as const,
      custom: { serviceRadiusMeters: null },
      petPolicies: [commonService.petPolicies[0], commonService.petPolicies[0]],
      availabilityExceptions: [
        { date: "2026-08-12", available: false, note: null },
        { date: "2026-08-12", available: true, note: null },
      ],
      discounts: [
        { label: "Impossible", kind: "PERCENT" as const, value: 101, condition: null },
      ],
      attachmentIds: ["photo-1", "photo-1"],
    };
    expect(servicePublishSchema.safeParse(input).success).toBe(false);
  });

  it("rejects duplicate weekdays inside one service availability rule", () => {
    expect(
      servicePublishSchema.safeParse({
        ...commonService,
        availabilityRules: [
          {
            kind: "WEEKLY",
            weekdays: [1, 1],
            startsOn: null,
            endsOn: null,
            includesHolidays: false,
          },
        ],
        mode: "HOME_VISIT",
        homeVisit: { serviceRadiusMeters: 5_000 },
      }).success,
    ).toBe(false);
  });

  it("requires a supported draft schema version", () => {
    const draft = {
      id: "draft-1",
      ownerId: "user-1",
      kind: "NEED",
      mode: null,
      schemaVersion: 1,
      revision: 0,
      currentStep: "care",
      payload: {},
      status: "ACTIVE",
    };
    expect(publishDraftEnvelopeSchema.safeParse(draft).success).toBe(true);
    expect(
      publishDraftEnvelopeSchema.safeParse({ ...draft, schemaVersion: 2 }).success,
    ).toBe(false);
    expect(
      publishDraftEnvelopeSchema.safeParse({
        ...draft,
        payload: { [["address", "Raw"].join("")]: "1-2-3 Example" },
      }).success,
    ).toBe(false);
  });
});
