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
  localTimes: [],
  intervalDays: null,
  dueDate: null,
  trigger: null,
  order: 0,
};

const commonNeed = {
  schemaVersion: 1 as const,
  draftId: "draft-1",
  revision: 2,
  idempotencyKey: "d9428888-122b-11e1-b85c-61cd3cbb3210",
  title: "Care for Mochi",
  description: null,
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
        excludedDates: [],
        visitsPerServiceDay: 1,
        visitWindows: [
          { visitNumber: 1, kind: "FLEXIBLE" as const, preferredLocalTime: null },
        ],
        tasks: [task],
      },
    };
    expect(needPublishSchema.safeParse(input).success).toBe(true);
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

  it("rejects expired ordering and out-of-range visit references", () => {
    const input = {
      ...commonNeed,
      startsAt: commonNeed.endsAt,
      endsAt: commonNeed.startsAt,
      mode: "HOME_VISIT" as const,
      homeVisit: {
        intervalDays: 1,
        firstServiceDate: "2026-08-10",
        excludedDates: [],
        visitsPerServiceDay: 1,
        visitWindows: [
          { visitNumber: 1, kind: "FLEXIBLE" as const, preferredLocalTime: null },
        ],
        tasks: [{ ...task, visitNumbers: [2] }],
      },
    };
    expect(needPublishSchema.safeParse(input).success).toBe(false);
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
