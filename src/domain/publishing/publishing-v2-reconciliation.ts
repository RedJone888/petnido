import type { CompatibilityIssueCode, PublishMode } from "./legacy-record-compatibility";

export type ReconciliationDifferenceCode =
  | "MODE_MISMATCH"
  | "LOCATION_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "AMOUNT_MISMATCH"
  | "PET_TOTAL_MISMATCH"
  | "PRICE_RULE_COUNT_MISMATCH"
  | "AVAILABILITY_RULE_COUNT_MISMATCH";

type LegacyNeedComparable = {
  mode: PublishMode;
  issues: CompatibilityIssueCode[];
  safeCandidate: {
    location?: { lat: number; lon: number };
    budget: { minAmountMinor: number | null; currency: string };
    pets: Array<{ quantity: number }>;
  };
};

type V2NeedComparable = {
  mode: PublishMode;
  location: { lat: number; lon: number };
  currency: string;
  minAmountMinor: number | null;
  petQuantities: number[];
};

type LegacyServiceComparable = {
  mode: PublishMode;
  issues: CompatibilityIssueCode[];
  safeCandidate: {
    location?: { lat: number; lon: number };
    currency: string;
    priceRules: Array<{ amountMinor: number }>;
    availabilityRules: unknown[];
  };
};

type V2ServiceComparable = {
  mode: PublishMode;
  location: { lat: number; lon: number };
  currency: string;
  priceAmountsMinor: number[];
  availabilityRuleCount: number;
};

const explainedBy: Partial<Record<ReconciliationDifferenceCode, CompatibilityIssueCode>> = {
  LOCATION_MISMATCH: "INVALID_COORDINATES",
  AMOUNT_MISMATCH: "MONEY_SEMANTICS_REQUIRE_CONFIRMATION",
  PET_TOTAL_MISMATCH: "PET_DETAILS_REQUIRE_CONFIRMATION",
  PRICE_RULE_COUNT_MISMATCH: "MONEY_SEMANTICS_REQUIRE_CONFIRMATION",
  AVAILABILITY_RULE_COUNT_MISMATCH: "AVAILABILITY_REQUIRES_CONFIRMATION",
};

function sameLocation(
  legacy: { lat: number; lon: number } | undefined,
  target: { lat: number; lon: number },
) {
  return Boolean(
    legacy &&
      Math.abs(legacy.lat - target.lat) < 0.000001 &&
      Math.abs(legacy.lon - target.lon) < 0.000001,
  );
}

function result(
  differences: ReconciliationDifferenceCode[],
  issues: CompatibilityIssueCode[],
) {
  const explainedDifferences = differences.filter((difference) => {
    const issue = explainedBy[difference];
    return issue ? issues.includes(issue) : false;
  });
  const unexplainedDifferences = differences.filter(
    (difference) => !explainedDifferences.includes(difference),
  );
  return {
    matched: differences.length === 0,
    differences,
    explainedDifferences,
    unexplainedDifferences,
  };
}

export function reconcileLegacyNeedWithV2(
  legacy: LegacyNeedComparable,
  target: V2NeedComparable,
) {
  const differences: ReconciliationDifferenceCode[] = [];
  if (legacy.mode !== target.mode) differences.push("MODE_MISMATCH");
  if (!sameLocation(legacy.safeCandidate.location, target.location)) differences.push("LOCATION_MISMATCH");
  if (legacy.safeCandidate.budget.currency !== target.currency) differences.push("CURRENCY_MISMATCH");
  if (legacy.safeCandidate.budget.minAmountMinor !== target.minAmountMinor) differences.push("AMOUNT_MISMATCH");
  const legacyPets = legacy.safeCandidate.pets.reduce((sum, pet) => sum + pet.quantity, 0);
  const targetPets = target.petQuantities.reduce((sum, quantity) => sum + quantity, 0);
  if (legacyPets !== targetPets) differences.push("PET_TOTAL_MISMATCH");
  return result(differences, legacy.issues);
}

export function reconcileLegacyServiceWithV2(
  legacy: LegacyServiceComparable,
  target: V2ServiceComparable,
) {
  const differences: ReconciliationDifferenceCode[] = [];
  if (legacy.mode !== target.mode) differences.push("MODE_MISMATCH");
  if (!sameLocation(legacy.safeCandidate.location, target.location)) differences.push("LOCATION_MISMATCH");
  if (legacy.safeCandidate.currency !== target.currency) differences.push("CURRENCY_MISMATCH");
  if (legacy.safeCandidate.priceRules.length !== target.priceAmountsMinor.length) {
    differences.push("PRICE_RULE_COUNT_MISMATCH");
  } else if (
    legacy.safeCandidate.priceRules.some(
      (rule, index) => rule.amountMinor !== target.priceAmountsMinor[index],
    )
  ) {
    differences.push("AMOUNT_MISMATCH");
  }
  if (legacy.safeCandidate.availabilityRules.length !== target.availabilityRuleCount) {
    differences.push("AVAILABILITY_RULE_COUNT_MISMATCH");
  }
  return result(differences, legacy.issues);
}

export function summarizeReconciliation(
  results: Array<ReturnType<typeof reconcileLegacyNeedWithV2>>,
) {
  return {
    comparedCount: results.length,
    exactMatchCount: results.filter((item) => item.matched).length,
    explainedDifferenceCount: results.reduce(
      (sum, item) => sum + item.explainedDifferences.length,
      0,
    ),
    unexplainedDifferenceCount: results.reduce(
      (sum, item) => sum + item.unexplainedDifferences.length,
      0,
    ),
    cutoverReady: results.every((item) => item.unexplainedDifferences.length === 0),
  };
}
