import { describe, expect, it } from "vitest";
import {
  calculateNeedPricing,
  formatNeedEstimatedBadge,
  formatMoneyAmount,
} from "./need-pricing";

describe("Need Pricing Domain Engine", () => {
  it("calculates exact home visit pricing with total visits correctly", () => {
    const pricing = calculateNeedPricing({
      mode: "HOME_VISIT",
      startsAt: "2026-09-01T00:00:00.000Z",
      endsAt: "2026-09-17T00:00:00.000Z",
      schedule: {
        homeVisit: {
          intervalDays: 1,
          visitsPerServiceDay: 2,
          excludedDates: [],
        },
      },
      budget: {
        kind: "EXACT",
        minAmountMinor: 1600,
        currency: "JPY",
        negotiable: true,
      },
      additionalCosts: [],
    });

    expect(pricing.totalUnitsCount).toBe(34);
    expect(pricing.unitRateMinor).toBe(1600);
    expect(pricing.careFeeSubtotalMinor).toBe(54400);
    expect(pricing.estimatedTotalMinMinor).toBe(54400);
    expect(pricing.isEstimateReady).toBe(true);
    expect(pricing.isNegotiable).toBe(true);

    expect(formatNeedEstimatedBadge(pricing)).toBe("¥54,400");
  });

  it("calculates exact home visit with fixed travel fee allowance", () => {
    const pricing = calculateNeedPricing({
      mode: "HOME_VISIT",
      startsAt: "2026-09-01T00:00:00.000Z",
      endsAt: "2026-09-05T00:00:00.000Z", // 5 days
      schedule: {
        homeVisit: {
          intervalDays: 1,
          visitsPerServiceDay: 1,
          excludedDates: [],
        },
      },
      budget: {
        kind: "EXACT",
        minAmountMinor: 2000,
        currency: "JPY",
      },
      additionalCosts: [
        {
          kind: "TRAVEL",
          mode: "FIXED",
          amountMinor: 500,
        },
      ],
    });

    expect(pricing.totalUnitsCount).toBe(5);
    expect(pricing.careFeeSubtotalMinor).toBe(10000);
    expect(pricing.travelFeeSubtotalMinor).toBe(2500);
    expect(pricing.estimatedTotalMinMinor).toBe(12500);
    expect(formatNeedEstimatedBadge(pricing)).toBe("¥12,500");
  });

  it("calculates range boarding pricing correctly", () => {
    const pricing = calculateNeedPricing({
      mode: "BOARDING",
      startsAt: "2026-09-01T00:00:00.000Z",
      endsAt: "2026-09-11T00:00:00.000Z", // 10 nights
      budget: {
        kind: "RANGE",
        minAmountMinor: 3000,
        maxAmountMinor: 4000,
        currency: "JPY",
      },
      additionalCosts: [
        {
          kind: "SUPPLIES",
          mode: "FIXED",
          amountMinor: 1000,
        },
      ],
    });

    expect(pricing.totalUnitsCount).toBe(10);
    expect(pricing.careFeeSubtotalMinor).toBe(30000);
    expect(pricing.careFeeMaxSubtotalMinor).toBe(40000);
    expect(pricing.estimatedTotalMinMinor).toBe(31000);
    expect(pricing.estimatedTotalMaxMinor).toBe(41000);
    expect(formatNeedEstimatedBadge(pricing)).toBe("¥31,000 – ¥41,000");
  });

  it("handles open to offers / discuss later", () => {
    const pricing = calculateNeedPricing({
      mode: "CUSTOM",
      startsAt: "2026-09-01T00:00:00.000Z",
      endsAt: "2026-09-01T00:00:00.000Z",
      budget: {
        kind: "OPEN",
        minAmountMinor: null,
        currency: "JPY",
      },
    });

    expect(pricing.isEstimateReady).toBe(false);
    expect(formatNeedEstimatedBadge(pricing, "待协商")).toBe("待协商");
  });

  it("handles legacy needs correctly", () => {
    const pricing = calculateNeedPricing({
      publicId: "legacy:need_123",
      source: "LEGACY",
      mode: "HOME_VISIT",
      startsAt: "2026-09-01T00:00:00.000Z",
      endsAt: "2026-09-05T00:00:00.000Z",
      schedule: {
        homeVisit: {
          intervalDays: 1,
          visitsPerServiceDay: 2,
        },
      },
      budget: {
        kind: "EXACT",
        minAmountMinor: 10000,
        currency: "JPY",
      },
    });

    expect(pricing.isLegacy).toBe(true);
    expect(pricing.estimatedTotalMinMinor).toBe(10000);
    expect(pricing.unitRateMinor).toBe(1000); // 10000 / 10 visits
    expect(formatNeedEstimatedBadge(pricing)).toBe("¥10,000");
  });
});
