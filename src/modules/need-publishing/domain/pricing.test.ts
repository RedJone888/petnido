import { describe, expect, it } from "vitest";

import { calculateNeedPricing } from "./pricing";

const dates = {
  startsAt: "2026-09-01",
  endsAt: "2026-09-03",
};

describe("need publishing pricing", () => {
  it("combines exact care and fixed travel per visit", () => {
    const result = calculateNeedPricing({
      mode: "HOME_VISIT",
      ...dates,
      schedule: { homeVisit: { intervalDays: 1, visitsPerServiceDay: 2 } },
      budget: {
        kind: "EXACT",
        minAmountMinor: 2_000,
        currency: "JPY",
        negotiable: true,
      },
      additionalCosts: [
        { kind: "TRAVEL", mode: "FIXED", amountMinor: 500 },
      ],
    });

    expect(result.totalUnitsCount).toBe(4);
    expect(result.estimatedTotalMinMinor).toBe(10_000);
    expect(result.isNegotiable).toBe(true);
    expect(result.completeness).toBe("COMPLETE");
  });

  it("keeps range arithmetic when fixed travel is present", () => {
    const result = calculateNeedPricing({
      mode: "HOME_VISIT",
      ...dates,
      schedule: { homeVisit: { intervalDays: 1, visitsPerServiceDay: 1 } },
      budget: {
        kind: "RANGE",
        minAmountMinor: 1_000,
        maxAmountMinor: 2_000,
        currency: "JPY",
        negotiable: true,
      },
      additionalCosts: [
        { kind: "TRAVEL", mode: "FIXED", amountMinor: 200 },
      ],
    });

    expect(result.estimatedTotalMinMinor).toBe(2_400);
    expect(result.estimatedTotalMaxMinor).toBe(4_400);
    expect(result.isNegotiable).toBe(false);
  });

  it("shows known travel when home visit care is open", () => {
    const result = calculateNeedPricing({
      mode: "HOME_VISIT",
      ...dates,
      schedule: { homeVisit: { intervalDays: 1, visitsPerServiceDay: 1 } },
      budget: { kind: "OPEN", minAmountMinor: null, currency: "JPY" },
      additionalCosts: [
        { kind: "TRAVEL", mode: "FIXED", amountMinor: 300 },
      ],
    });

    expect(result.estimatedTotalMinMinor).toBe(600);
    expect(result.statusNote).toBe("EXCLUDING_CARE");
    expect(result.unknownCosts).toEqual([{ kind: "CARE", mode: "DISCUSS" }]);
  });

  it("counts every visit in the selected cadence", () => {
    const result = calculateNeedPricing({
      mode: "HOME_VISIT",
      ...dates,
      schedule: {
        homeVisit: {
          intervalDays: 1,
          visitsPerServiceDay: 1,
        },
      },
      budget: { kind: "EXACT", minAmountMinor: 1_000, currency: "JPY" },
    });

    expect(result.totalUnitsCount).toBe(2);
  });

  it("adds boarding fixed costs once and reports unknown actual costs", () => {
    const result = calculateNeedPricing({
      mode: "BOARDING",
      startsAt: "2026-09-01",
      endsAt: "2026-09-04",
      budget: {
        kind: "RANGE",
        minAmountMinor: 3_000,
        maxAmountMinor: 4_000,
        currency: "JPY",
      },
      additionalCosts: [
        { kind: "SUPPLY", mode: "FIXED", amountMinor: 1_000 },
        { kind: "TRAVEL", mode: "ACTUAL", amountMinor: null },
      ],
    });

    expect(result.totalUnitsCount).toBe(3);
    expect(result.estimatedTotalMinMinor).toBe(10_000);
    expect(result.estimatedTotalMaxMinor).toBe(13_000);
    expect(result.completeness).toBe("EXCLUDES_ACTUAL_COSTS");
    expect(result.unknownCosts).toContainEqual({
      kind: "TRAVEL",
      mode: "ACTUAL",
    });
  });

  it("returns discuss-later when no custom amount is known", () => {
    const result = calculateNeedPricing({
      mode: "CUSTOM",
      ...dates,
      budget: { kind: "OPEN", minAmountMinor: null, currency: "JPY" },
    });

    expect(result.isEstimateReady).toBe(false);
    expect(result.estimatedTotalMinMinor).toBeNull();
    expect(result.completeness).toBe("INCOMPLETE");
  });
});
