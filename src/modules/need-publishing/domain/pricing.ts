import type { Lang } from "@/domain/lang/types";

export type NeedPricingMode = "HOME_VISIT" | "BOARDING" | "CUSTOM";
export type NeedBudgetKind = "EXACT" | "RANGE" | "OPEN";
export type NeedCostKind = "TRAVEL" | "SUPPLY";
export type NeedCostMode = "FIXED" | "ACTUAL" | "DISCUSS" | "NONE";
export type NeedPricingCompleteness =
  | "COMPLETE"
  | "EXCLUDES_ACTUAL_COSTS"
  | "EXCLUDES_DISCUSS_COSTS"
  | "PARTIAL"
  | "INCOMPLETE";

export type NeedPricingInput = {
  mode: NeedPricingMode | string;
  source?: "V2" | "LEGACY" | string;
  publicId?: string;
  startsAt: Date | string;
  endsAt: Date | string;
  schedule?: {
    homeVisit?: {
      intervalDays: number | null;
      firstServiceDate?: Date | string | null;
      visitsPerServiceDay: number | null;
    } | null;
    boarding?: {
      transportMode?: string | null;
      handoffDirection?: string | null;
      maxProviderDistanceMeters?: number | null;
    } | null;
    custom?: {
      timePreference?: string | null;
      exactTime?: string | null;
    } | null;
  } | null;
  budget: {
    kind: NeedBudgetKind | string;
    minAmountMinor: number | null;
    maxAmountMinor?: number | null;
    currency: string;
    negotiable?: boolean;
  };
  additionalCosts?: Array<{
    /** SUPPLIES is accepted only while legacy public DTOs are being retired. */
    kind: NeedCostKind | "SUPPLIES" | string;
    mode: NeedCostMode | string;
    amountMinor: number | null;
  }>;
};

export type NeedPricingUnknownCost = {
  kind: "CARE" | NeedCostKind;
  mode: "ACTUAL" | "DISCUSS";
};

export type NeedPricingFormulaTerm =
  | "CARE_PER_VISIT"
  | "TRAVEL_PER_VISIT"
  | "VISITS"
  | "CARE_PER_NIGHT"
  | "NIGHTS"
  | "SUPPLY_TOTAL"
  | "TRAVEL_TOTAL"
  | "SERVICE_TOTAL";

export type NeedPricingSummary = {
  mode: NeedPricingMode;
  isLegacy: boolean;
  currency: string;
  budgetKind: NeedBudgetKind;
  isNegotiable: boolean;
  unitType: "visit" | "night" | "total";
  totalUnitsCount: number;
  serviceDaysCount: number;
  unitRateMinor: number | null;
  unitMaxRateMinor: number | null;
  careFeeSubtotalMinor: number | null;
  careFeeMaxSubtotalMinor: number | null;
  travelMode: NeedCostMode;
  supplyMode: NeedCostMode;
  fixedTravelPerVisitMinor: number | null;
  travelFeeSubtotalMinor: number | null;
  fixedSupplyMinor: number;
  fixedTravelTotalMinor: number;
  fixedBoardingAdditionsMinor: number;
  isEstimateReady: boolean;
  estimatedTotalMinMinor: number | null;
  estimatedTotalMaxMinor: number | null;
  completeness: NeedPricingCompleteness;
  unknownCosts: NeedPricingUnknownCost[];
  formulaTerms: NeedPricingFormulaTerm[];
  statusNote:
    | "EXCLUDING_TRAVEL"
    | "EXCLUDING_SUPPLY"
    | "EXCLUDING_ADDITIONAL_COSTS"
    | "EXCLUDING_CARE"
    | "ALL_INCLUDED"
    | null;
};

export function parseDateValue(
  value: string | Date | undefined | null,
): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime())
      ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
      : undefined;
  }
  const str = String(value).trim();
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (ymdMatch) {
    return new Date(
      Number(ymdMatch[1]),
      Number(ymdMatch[2]) - 1,
      Number(ymdMatch[3]),
    );
  }
  const date = new Date(str);
  return Number.isFinite(date.getTime())
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
    : undefined;
}

export function inclusiveDayCount(
  startsAt: Date | string,
  endsAt: Date | string,
): number {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

export function calculateBoardingNights(
  startsAt: Date | string,
  endsAt: Date | string,
): number {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end) return 0;
  if (start.getTime() >= end.getTime()) return 0;
  // Published NeedV2 dates use an exclusive end instant. A stay from the
  // first through the next morning is one night, not two calendar dates.
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

export function calculateTotalHomeVisits(
  startsAt: Date | string,
  endsAt: Date | string,
  schedule?: {
    intervalDays: number | null;
    firstServiceDate?: Date | string | null;
    visitsPerServiceDay: number | null;
  } | null,
): { serviceDays: number; totalVisits: number } {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end || start >= end) return { serviceDays: 0, totalVisits: 0 };

  const requestedFirst = parseDateValue(schedule?.firstServiceDate);
  const first =
    requestedFirst && requestedFirst >= start && requestedFirst < end
      ? requestedFirst
      : start;
  const intervalDays = Math.max(1, schedule?.intervalDays ?? 1);
  const visitsPerServiceDay = Math.max(1, schedule?.visitsPerServiceDay ?? 1);
  let serviceDays = 0;
  const cursor = new Date(first);
  let guard = 0;
  // Published NeedV2 dates use an exclusive end instant. Excluded dates are
  // intentionally ignored: date exceptions are retired from need publishing.
  while (cursor < end && guard < 3660) {
    serviceDays += 1;
    cursor.setDate(cursor.getDate() + intervalDays);
    guard += 1;
  }
  return { serviceDays, totalVisits: serviceDays * visitsPerServiceDay };
}

function normalizeMode(value: string | undefined): NeedCostMode {
  return value === "FIXED" ||
    value === "ACTUAL" ||
    value === "DISCUSS" ||
    value === "NONE"
    ? value
    : "NONE";
}

function normalizedCosts(input: NeedPricingInput) {
  return (input.additionalCosts ?? []).map((cost) => ({
    ...cost,
    kind: cost.kind === "SUPPLIES" ? ("SUPPLY" as const) : cost.kind,
    mode: normalizeMode(cost.mode),
  }));
}

function unknownCompleteness(
  unknownCosts: NeedPricingUnknownCost[],
  hasKnownTotal: boolean,
): NeedPricingCompleteness {
  if (!hasKnownTotal) return "INCOMPLETE";
  const hasActual = unknownCosts.some((cost) => cost.mode === "ACTUAL");
  const hasDiscuss = unknownCosts.some((cost) => cost.mode === "DISCUSS");
  if (hasActual && hasDiscuss) return "PARTIAL";
  if (hasActual) return "EXCLUDES_ACTUAL_COSTS";
  if (hasDiscuss) return "EXCLUDES_DISCUSS_COSTS";
  return "COMPLETE";
}

function legacySummary(
  input: NeedPricingInput,
  mode: NeedPricingMode,
  units: number,
  serviceDays: number,
): NeedPricingSummary {
  const total = input.budget.minAmountMinor ?? 0;
  const unitRate = Math.round(total / Math.max(1, units));
  return {
    mode,
    isLegacy: true,
    currency: input.budget.currency || "JPY",
    budgetKind: "EXACT",
    isNegotiable: false,
    unitType: mode === "HOME_VISIT" ? "visit" : mode === "BOARDING" ? "night" : "total",
    totalUnitsCount: units,
    serviceDaysCount: serviceDays,
    unitRateMinor: unitRate,
    unitMaxRateMinor: null,
    careFeeSubtotalMinor: total,
    careFeeMaxSubtotalMinor: null,
    travelMode: "NONE",
    supplyMode: "NONE",
    fixedTravelPerVisitMinor: 0,
    travelFeeSubtotalMinor: 0,
    fixedSupplyMinor: 0,
    fixedTravelTotalMinor: 0,
    fixedBoardingAdditionsMinor: 0,
    isEstimateReady: total > 0,
    estimatedTotalMinMinor: total > 0 ? total : null,
    estimatedTotalMaxMinor: null,
    completeness: total > 0 ? "COMPLETE" : "INCOMPLETE",
    unknownCosts: [],
    formulaTerms: mode === "CUSTOM" ? ["SERVICE_TOTAL"] : [],
    statusNote: null,
  };
}

export function calculateNeedPricing(
  input: NeedPricingInput,
): NeedPricingSummary {
  const mode =
    input.mode === "BOARDING" || input.mode === "CUSTOM"
      ? input.mode
      : "HOME_VISIT";
  const budgetKind =
    input.budget.kind === "RANGE" || input.budget.kind === "OPEN"
      ? input.budget.kind
      : "EXACT";
  const currency = input.budget.currency || "JPY";
  const isLegacy =
    input.source === "LEGACY" ||
    (typeof input.publicId === "string" && input.publicId.startsWith("legacy:"));
  const costs = normalizedCosts(input);
  const travel = costs.find((cost) => cost.kind === "TRAVEL");
  const supply = costs.find((cost) => cost.kind === "SUPPLY");
  const travelMode = normalizeMode(travel?.mode);
  const supplyMode = normalizeMode(supply?.mode);
  const travelFixed =
    travelMode === "FIXED" ? Math.max(0, travel?.amountMinor ?? 0) : 0;
  const supplyFixed =
    supplyMode === "FIXED" ? Math.max(0, supply?.amountMinor ?? 0) : 0;

  const homeUnits = calculateTotalHomeVisits(
    input.startsAt,
    input.endsAt,
    input.schedule?.homeVisit,
  );
  const boardingNights = calculateBoardingNights(input.startsAt, input.endsAt);
  const units = mode === "HOME_VISIT" ? homeUnits.totalVisits : mode === "BOARDING" ? boardingNights : 1;
  const serviceDays = mode === "HOME_VISIT" ? homeUnits.serviceDays : mode === "BOARDING" ? boardingNights : 1;

  if (isLegacy) return legacySummary(input, mode, units, serviceDays);

  const careKnown = budgetKind !== "OPEN";
  const unitMin = careKnown ? Math.max(0, input.budget.minAmountMinor ?? 0) : null;
  const unitMax =
    budgetKind === "RANGE"
      ? Math.max(unitMin ?? 0, input.budget.maxAmountMinor ?? 0)
      : null;
  const careMultiplier = mode === "CUSTOM" ? 1 : units;
  const careMin = unitMin === null ? null : unitMin * careMultiplier;
  const careMax =
    unitMin === null
      ? null
      : (unitMax ?? unitMin) * careMultiplier;
  const isNegotiable = budgetKind === "EXACT" && Boolean(input.budget.negotiable);

  const unknownCosts: NeedPricingUnknownCost[] = [];
  if (!careKnown) unknownCosts.push({ kind: "CARE", mode: "DISCUSS" });
  if (travelMode === "ACTUAL" || travelMode === "DISCUSS") {
    unknownCosts.push({ kind: "TRAVEL", mode: travelMode });
  }
  if (
    mode === "BOARDING" &&
    (supplyMode === "ACTUAL" || supplyMode === "DISCUSS")
  ) {
    unknownCosts.push({ kind: "SUPPLY", mode: supplyMode });
  }

  const fixedTravelTotal =
    mode === "HOME_VISIT" ? travelFixed * units : travelFixed;
  const fixedSupplyTotal = mode === "BOARDING" ? supplyFixed : 0;
  const knownAdditions = fixedTravelTotal + fixedSupplyTotal;
  const knownMin = (careMin ?? 0) + knownAdditions;
  const knownMax = (careMax ?? careMin ?? 0) + knownAdditions;
  const hasKnownTotal = knownMin > 0 || knownMax > 0;
  const completeness = unknownCompleteness(unknownCosts, hasKnownTotal);

  const formulaTerms: NeedPricingFormulaTerm[] = [];
  if (careKnown) {
    formulaTerms.push(
      mode === "HOME_VISIT"
        ? "CARE_PER_VISIT"
        : mode === "BOARDING"
          ? "CARE_PER_NIGHT"
          : "SERVICE_TOTAL",
    );
    if (mode === "HOME_VISIT") formulaTerms.push("VISITS");
    if (mode === "BOARDING") formulaTerms.push("NIGHTS");
  }
  if (travelFixed > 0) {
    formulaTerms.push(mode === "HOME_VISIT" ? "TRAVEL_PER_VISIT" : "TRAVEL_TOTAL");
    if (mode === "HOME_VISIT" && !formulaTerms.includes("VISITS")) {
      formulaTerms.push("VISITS");
    }
  }
  if (fixedSupplyTotal > 0) formulaTerms.push("SUPPLY_TOTAL");

  const statusNote =
    unknownCosts.some((cost) => cost.kind === "CARE") && hasKnownTotal
      ? "EXCLUDING_CARE"
      : unknownCosts.some((cost) => cost.kind === "TRAVEL") &&
          unknownCosts.some((cost) => cost.kind === "SUPPLY")
        ? "EXCLUDING_ADDITIONAL_COSTS"
        : unknownCosts.some((cost) => cost.kind === "TRAVEL")
          ? "EXCLUDING_TRAVEL"
          : unknownCosts.some((cost) => cost.kind === "SUPPLY")
            ? "EXCLUDING_SUPPLY"
            : hasKnownTotal
              ? "ALL_INCLUDED"
              : null;

  return {
    mode,
    isLegacy: false,
    currency,
    budgetKind,
    isNegotiable,
    unitType: mode === "HOME_VISIT" ? "visit" : mode === "BOARDING" ? "night" : "total",
    totalUnitsCount: units,
    serviceDaysCount: serviceDays,
    unitRateMinor: unitMin,
    unitMaxRateMinor: unitMax,
    careFeeSubtotalMinor: careMin,
    careFeeMaxSubtotalMinor: careMax,
    travelMode,
    supplyMode,
    fixedTravelPerVisitMinor: mode === "HOME_VISIT" ? travelFixed : 0,
    travelFeeSubtotalMinor: fixedTravelTotal,
    fixedSupplyMinor: fixedSupplyTotal,
    fixedTravelTotalMinor: fixedTravelTotal,
    fixedBoardingAdditionsMinor:
      mode === "BOARDING" ? fixedSupplyTotal + fixedTravelTotal : 0,
    isEstimateReady: hasKnownTotal,
    estimatedTotalMinMinor: hasKnownTotal ? knownMin : null,
    estimatedTotalMaxMinor:
      hasKnownTotal && budgetKind === "RANGE" ? knownMax : null,
    completeness,
    unknownCosts,
    formulaTerms,
    statusNote,
  };
}

export function formatMoneyAmount(
  amount: number | null | undefined,
  currency: string,
  lang?: Lang,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const divisor = currency === "JPY" || currency === "KRW" ? 1 : 100;
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    maximumFractionDigits: divisor === 1 ? 0 : 2,
  }).format(amount / divisor);
}

export function formatNeedEstimatedBadge(
  pricing: NeedPricingSummary,
  fallback = "可协商",
  lang?: Lang,
): string {
  if (!pricing.isEstimateReady || pricing.estimatedTotalMinMinor === null) {
    return fallback;
  }
  const min = formatMoneyAmount(
    pricing.estimatedTotalMinMinor,
    pricing.currency,
    lang,
  );
  if (pricing.estimatedTotalMaxMinor !== null) {
    return `${min} – ${formatMoneyAmount(
      pricing.estimatedTotalMaxMinor,
      pricing.currency,
      lang,
    )}`;
  }
  return min;
}

/** Localized explanation of the exact same branches used by the calculator. */
export function formatNeedPricingFormula(
  pricing: NeedPricingSummary,
  lang: Lang = "en",
) {
  const copy = {
    en: { care: "care fee", travel: "travel", supply: "supplies", visits: "visits", nights: "nights", total: "service fee", discuss: "To be discussed" },
    zh: { care: "照护费", travel: "交通费", supply: "物品费", visits: "上门次数", nights: "寄养晚数", total: "服务费", discuss: "待协商" },
    ja: { care: "お世話料金", travel: "交通費", supply: "物品費", visits: "訪問回数", nights: "宿泊数", total: "サービス料金", discuss: "要相談" },
  }[lang];
  const careKnown = pricing.careFeeSubtotalMinor !== null;
  const travelFixed = pricing.travelMode === "FIXED";
  const supplyFixed = pricing.supplyMode === "FIXED";
  if (pricing.mode === "HOME_VISIT") {
    if (careKnown && travelFixed) return `(${copy.care} + ${copy.travel}) × ${copy.visits}`;
    if (careKnown) return `${copy.care} × ${copy.visits}`;
    if (travelFixed) return `${copy.travel} × ${copy.visits}`;
    return copy.discuss;
  }
  if (pricing.mode === "CUSTOM") return careKnown ? copy.total : copy.discuss;
  const terms = [
    ...(careKnown ? [`${copy.care} × ${copy.nights}`] : []),
    ...(supplyFixed ? [copy.supply] : []),
    ...(travelFixed ? [copy.travel] : []),
  ];
  return terms.length ? terms.join(" + ") : copy.discuss;
}
