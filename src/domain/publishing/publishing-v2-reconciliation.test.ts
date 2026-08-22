import { describe, expect, it } from "vitest";

import {
  reconcileLegacyNeedWithV2,
  reconcileLegacyServiceWithV2,
  summarizeReconciliation,
} from "./publishing-v2-reconciliation";

describe("publishing V2 reconciliation", () => {
  it("accepts exact safe-field parity", () => {
    const result = reconcileLegacyNeedWithV2(
      {
        mode: "HOME_VISIT",
        issues: [],
        safeCandidate: {
          location: { lat: 35.68, lon: 139.76 },
          budget: { minAmountMinor: 8000, currency: "JPY" },
          pets: [{ quantity: 1 }, { quantity: 2 }],
        },
      },
      {
        mode: "HOME_VISIT",
        location: { lat: 35.68, lon: 139.76 },
        currency: "JPY",
        minAmountMinor: 8000,
        petQuantities: [1, 2],
      },
    );
    expect(result).toEqual({
      matched: true,
      differences: [],
      explainedDifferences: [],
      unexplainedDifferences: [],
    });
  });

  it("separates expected user-confirmed enrichment from unexplained differences", () => {
    const result = reconcileLegacyServiceWithV2(
      {
        mode: "BOARDING",
        issues: ["MONEY_SEMANTICS_REQUIRE_CONFIRMATION", "AVAILABILITY_REQUIRES_CONFIRMATION"],
        safeCandidate: {
          location: { lat: 34.69, lon: 135.5 },
          currency: "JPY",
          priceRules: [{ amountMinor: 3000 }],
          availabilityRules: [{}],
        },
      },
      {
        mode: "HOME_VISIT",
        location: { lat: 34.69, lon: 135.5 },
        currency: "JPY",
        priceAmountsMinor: [3500],
        availabilityRuleCount: 2,
      },
    );
    expect(result.explainedDifferences).toEqual([
      "AMOUNT_MISMATCH",
      "AVAILABILITY_RULE_COUNT_MISMATCH",
    ]);
    expect(result.unexplainedDifferences).toEqual(["MODE_MISMATCH"]);
  });

  it("blocks cutover when any unexplained difference remains", () => {
    const summary = summarizeReconciliation([
      {
        matched: false,
        differences: ["AMOUNT_MISMATCH"],
        explainedDifferences: ["AMOUNT_MISMATCH"],
        unexplainedDifferences: [],
      },
      {
        matched: false,
        differences: ["MODE_MISMATCH"],
        explainedDifferences: [],
        unexplainedDifferences: ["MODE_MISMATCH"],
      },
    ]);
    expect(summary).toEqual({
      comparedCount: 2,
      exactMatchCount: 0,
      explainedDifferenceCount: 1,
      unexplainedDifferenceCount: 1,
      cutoverReady: false,
    });
  });

  it("accepts an empty, successfully queried staging baseline", () => {
    expect(summarizeReconciliation([])).toEqual({
      comparedCount: 0,
      exactMatchCount: 0,
      explainedDifferenceCount: 0,
      unexplainedDifferenceCount: 0,
      cutoverReady: true,
    });
  });
});
