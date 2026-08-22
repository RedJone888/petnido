import { describe, expect, it } from "vitest";

import {
  assessLegacyNeedCompatibility,
  assessLegacyServiceCompatibility,
  legacyNeedCompatibilitySelect,
  legacyServiceCompatibilitySelect,
  summarizeCompatibility,
} from "./legacy-record-compatibility";

describe("legacy record compatibility", () => {
  it("maps only safe need fields and requires confirmation instead of inventing details", () => {
    const result = assessLegacyNeedCompatibility({
      id: "need-1",
      title: "Care request",
      category: "FOSTER",
      status: "OPEN",
      startDate: new Date("2026-08-10T00:00:00.000Z"),
      endDate: new Date("2026-08-12T00:00:00.000Z"),
      addressLat: 35.68,
      addressLon: 139.76,
      currency: "JPY",
      totalPrice: 8000,
      needPets: [{ id: "legacy-pet", petCategory: "CAT", petType: null, count: 2, petIds: [] }],
    });
    expect(result).toMatchObject({
      mode: "BOARDING",
      canAutoPublish: false,
      issues: expect.arrayContaining([
        "PET_DETAILS_REQUIRE_CONFIRMATION",
        "TASKS_REQUIRE_STRUCTURED_CONFIRMATION",
        "MONEY_SEMANTICS_REQUIRE_CONFIRMATION",
      ]),
      safeCandidate: {
        location: { lat: 35.68, lon: 139.76, regionLabel: null },
        pets: [{ quantity: 2, sourcePetIds: [] }],
      },
    });
  });

  it("marks missing boarding capacity and environment as user confirmations", () => {
    const result = assessLegacyServiceCompatibility({
      id: "service-1",
      serviceType: "FOSTER",
      customType: null,
      isActive: true,
      areaLat: 34.69,
      areaLon: 135.5,
      currency: "USD",
      availabilityRangeType: "LONG_TERM",
      availabilityWeekPattern: "WEEKENDS_ONLY",
      includeHolidays: true,
      availableFrom: null,
      availableTo: null,
      priceUnit: "DAY",
      priceRules: [{ groupLabel: "Standard", price: 12.5 }],
      photos: [{ id: "photo-1" }],
    });
    expect(result).toMatchObject({
      mode: "BOARDING",
      canAutoPublish: false,
      issues: expect.arrayContaining([
        "BOARDING_CAPACITY_REQUIRED",
        "BOARDING_ENVIRONMENT_REQUIRED",
        "PET_POLICIES_REQUIRE_CONFIRMATION",
      ]),
      safeCandidate: {
        availabilityRules: [{ weekdays: [6, 7] }],
        priceRules: [{ amountMinor: 1250, unit: "DAY" }],
      },
    });
  });

  it("never selects old raw location text for compatibility reads", () => {
    const serialized = JSON.stringify({
      need: legacyNeedCompatibilitySelect,
      service: legacyServiceCompatibilitySelect,
    });
    expect(serialized).not.toContain("addressRaw");
    expect(serialized).not.toContain("areaRaw");
    expect(serialized).not.toContain("baseAreaRaw");
  });

  it("produces aggregate confirmation counts without record content", () => {
    const summary = summarizeCompatibility([
      { issues: ["BOARDING_CAPACITY_REQUIRED", "PET_POLICIES_REQUIRE_CONFIRMATION"] },
      { issues: ["PET_POLICIES_REQUIRE_CONFIRMATION"] },
    ]);
    expect(summary).toMatchObject({
      sourceCount: 2,
      autoPublishableCount: 0,
      requiresConfirmationCount: 2,
      issueCounts: {
        BOARDING_CAPACITY_REQUIRED: 1,
        PET_POLICIES_REQUIRE_CONFIRMATION: 2,
      },
    });
    expect(JSON.stringify(summary)).not.toContain("service-");
  });
});
