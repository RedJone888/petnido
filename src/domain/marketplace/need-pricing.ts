import type { Lang } from "@/domain/lang/types";

export type NeedPricingMode = "HOME_VISIT" | "BOARDING" | "CUSTOM";
export type NeedBudgetKind = "EXACT" | "RANGE" | "OPEN";

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
      excludedDates?: Array<Date | string>;
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
    kind: "TRAVEL" | "SUPPLIES" | string;
    mode: "FIXED" | "ACTUAL" | "NONE" | string;
    amountMinor: number | null;
  }>;
};

export type NeedPricingSummary = {
  mode: NeedPricingMode;
  isLegacy: boolean;
  currency: string;
  budgetKind: NeedBudgetKind;
  isNegotiable: boolean;

  // Units
  unitType: "visit" | "night" | "total";
  totalUnitsCount: number;
  serviceDaysCount: number;

  // Care fee per unit
  unitRateMinor: number | null;
  unitMaxRateMinor: number | null;
  careFeeSubtotalMinor: number | null;
  careFeeMaxSubtotalMinor: number | null;

  // Additional costs
  travelMode: "FIXED" | "ACTUAL" | "NONE";
  fixedTravelPerVisitMinor: number | null;
  travelFeeSubtotalMinor: number | null;
  fixedBoardingAdditionsMinor: number;

  // Estimated Total
  isEstimateReady: boolean;
  estimatedTotalMinMinor: number | null;
  estimatedTotalMaxMinor: number | null;

  // Explanatory note
  statusNote: "EXCLUDING_TRAVEL" | "EXCLUDING_CARE" | "ALL_INCLUDED" | null;
};

export function parseDateValue(value: string | Date | undefined | null): Date | undefined {
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
  const d = new Date(str);
  return Number.isFinite(d.getTime())
    ? new Date(d.getFullYear(), d.getMonth(), d.getDate())
    : undefined;
}

export function inclusiveDayCount(startsAt: Date | string, endsAt: Date | string): number {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

export function calculateBoardingNights(startsAt: Date | string, endsAt: Date | string): number {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, diff);
}

export function calculateTotalHomeVisits(
  startsAt: Date | string,
  endsAt: Date | string,
  schedule?: {
    intervalDays: number | null;
    firstServiceDate?: Date | string | null;
    visitsPerServiceDay: number | null;
    excludedDates?: Array<Date | string>;
  } | null,
): { serviceDays: number; totalVisits: number } {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end || start > end) {
    return { serviceDays: 1, totalVisits: 1 };
  }

  const intervalDays = Math.max(1, schedule?.intervalDays ?? 1);
  const visitsPerServiceDay = Math.max(1, schedule?.visitsPerServiceDay ?? 1);

  const excluded = new Set(
    (schedule?.excludedDates ?? [])
      .map((val) => parseDateValue(val))
      .filter((d): d is Date => Boolean(d))
      .map(
        (d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      ),
  );

  let serviceDays = 0;
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 3660) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!excluded.has(key)) {
      serviceDays += 1;
    }
    cursor.setDate(cursor.getDate() + intervalDays);
    guard += 1;
  }

  const finalDays = Math.max(1, serviceDays);
  return {
    serviceDays: finalDays,
    totalVisits: finalDays * visitsPerServiceDay,
  };
}

export function calculateNeedPricing(input: NeedPricingInput): NeedPricingSummary {
  const isLegacy =
    input.source === "LEGACY" || (typeof input.publicId === "string" && input.publicId.startsWith("legacy:"));
  const mode = (input.mode as NeedPricingMode) || "HOME_VISIT";
  const currency = input.budget.currency || "JPY";
  const budgetKind = (input.budget.kind as NeedBudgetKind) || "EXACT";
  const isNegotiable = Boolean(input.budget.negotiable);

  const rawMin = input.budget.minAmountMinor;
  const rawMax = input.budget.maxAmountMinor ?? null;

  // Additional costs parsing
  const travelCost = (input.additionalCosts ?? []).find((c) => c.kind === "TRAVEL");
  const travelMode: "FIXED" | "ACTUAL" | "NONE" =
    travelCost?.mode === "FIXED" ? "FIXED" : travelCost?.mode === "ACTUAL" ? "ACTUAL" : "NONE";
  const fixedTravelPerVisitMinor = travelMode === "FIXED" && travelCost?.amountMinor ? travelCost.amountMinor : 0;

  const fixedBoardingAdditionsMinor = (input.additionalCosts ?? []).reduce(
    (sum, c) => sum + (c.mode === "FIXED" && c.amountMinor ? c.amountMinor : 0),
    0,
  );

  // 1. HOME_VISIT
  if (mode === "HOME_VISIT") {
    const { serviceDays, totalVisits } = calculateTotalHomeVisits(
      input.startsAt,
      input.endsAt,
      input.schedule?.homeVisit,
    );
    const unitType = "visit" as const;
    const travelFeeSubtotal = fixedTravelPerVisitMinor * totalVisits;

    if (isLegacy) {
      const estimatedTotal = rawMin ?? 0;
      const unitRate = Math.round(estimatedTotal / Math.max(1, totalVisits));
      return {
        mode,
        isLegacy: true,
        currency,
        budgetKind: "EXACT",
        isNegotiable: false,
        unitType,
        totalUnitsCount: totalVisits,
        serviceDaysCount: serviceDays,
        unitRateMinor: unitRate,
        unitMaxRateMinor: null,
        careFeeSubtotalMinor: estimatedTotal,
        careFeeMaxSubtotalMinor: null,
        travelMode: "NONE",
        fixedTravelPerVisitMinor: 0,
        travelFeeSubtotalMinor: 0,
        fixedBoardingAdditionsMinor: 0,
        isEstimateReady: estimatedTotal > 0,
        estimatedTotalMinMinor: estimatedTotal,
        estimatedTotalMaxMinor: null,
        statusNote: null,
      };
    }

    if (budgetKind === "OPEN") {
      const hasFixedTravel = travelMode === "FIXED" && travelFeeSubtotal > 0;
      return {
        mode,
        isLegacy: false,
        currency,
        budgetKind,
        isNegotiable,
        unitType,
        totalUnitsCount: totalVisits,
        serviceDaysCount: serviceDays,
        unitRateMinor: null,
        unitMaxRateMinor: null,
        careFeeSubtotalMinor: null,
        careFeeMaxSubtotalMinor: null,
        travelMode,
        fixedTravelPerVisitMinor,
        travelFeeSubtotalMinor: travelFeeSubtotal,
        fixedBoardingAdditionsMinor: 0,
        isEstimateReady: hasFixedTravel,
        estimatedTotalMinMinor: hasFixedTravel ? travelFeeSubtotal : null,
        estimatedTotalMaxMinor: null,
        statusNote: hasFixedTravel ? "EXCLUDING_CARE" : null,
      };
    }

    if (budgetKind === "RANGE") {
      const careUnitMin = rawMin ?? 0;
      const careUnitMax = rawMax ?? careUnitMin;
      const careFeeSubtotalMin = careUnitMin * totalVisits;
      const careFeeSubtotalMax = careUnitMax * totalVisits;
      const estimatedTotalMin = (careUnitMin + fixedTravelPerVisitMinor) * totalVisits;
      const estimatedTotalMax = (careUnitMax + fixedTravelPerVisitMinor) * totalVisits;
      const isReady = careUnitMin > 0 && careUnitMax > careUnitMin;

      return {
        mode,
        isLegacy: false,
        currency,
        budgetKind,
        isNegotiable,
        unitType,
        totalUnitsCount: totalVisits,
        serviceDaysCount: serviceDays,
        unitRateMinor: careUnitMin,
        unitMaxRateMinor: careUnitMax,
        careFeeSubtotalMinor: careFeeSubtotalMin,
        careFeeMaxSubtotalMinor: careFeeSubtotalMax,
        travelMode,
        fixedTravelPerVisitMinor,
        travelFeeSubtotalMinor: travelFeeSubtotal,
        fixedBoardingAdditionsMinor: 0,
        isEstimateReady: isReady,
        estimatedTotalMinMinor: isReady ? estimatedTotalMin : null,
        estimatedTotalMaxMinor: isReady ? estimatedTotalMax : null,
        statusNote: travelMode === "ACTUAL" ? "EXCLUDING_TRAVEL" : null,
      };
    }

    // EXACT
    const careUnit = rawMin ?? 0;
    const careFeeSubtotal = careUnit * totalVisits;
    const estimatedTotal = (careUnit + fixedTravelPerVisitMinor) * totalVisits;
    const isReady = careUnit > 0;

    return {
      mode,
      isLegacy: false,
      currency,
      budgetKind,
      isNegotiable,
      unitType,
      totalUnitsCount: totalVisits,
      serviceDaysCount: serviceDays,
      unitRateMinor: careUnit,
      unitMaxRateMinor: null,
      careFeeSubtotalMinor: careFeeSubtotal,
      careFeeMaxSubtotalMinor: null,
      travelMode,
      fixedTravelPerVisitMinor,
      travelFeeSubtotalMinor: travelFeeSubtotal,
      fixedBoardingAdditionsMinor: 0,
      isEstimateReady: isReady,
      estimatedTotalMinMinor: isReady ? estimatedTotal : null,
      estimatedTotalMaxMinor: null,
      statusNote: travelMode === "ACTUAL" ? "EXCLUDING_TRAVEL" : null,
    };
  }

  // 2. BOARDING
  if (mode === "BOARDING") {
    const nights = calculateBoardingNights(input.startsAt, input.endsAt);
    const unitType = "night" as const;

    if (isLegacy) {
      const estimatedTotal = rawMin ?? 0;
      const unitRate = Math.round(estimatedTotal / Math.max(1, nights));
      return {
        mode,
        isLegacy: true,
        currency,
        budgetKind: "EXACT",
        isNegotiable: false,
        unitType,
        totalUnitsCount: nights,
        serviceDaysCount: nights + 1,
        unitRateMinor: unitRate,
        unitMaxRateMinor: null,
        careFeeSubtotalMinor: estimatedTotal,
        careFeeMaxSubtotalMinor: null,
        travelMode: "NONE",
        fixedTravelPerVisitMinor: 0,
        travelFeeSubtotalMinor: 0,
        fixedBoardingAdditionsMinor: 0,
        isEstimateReady: estimatedTotal > 0,
        estimatedTotalMinMinor: estimatedTotal,
        estimatedTotalMaxMinor: null,
        statusNote: null,
      };
    }

    if (budgetKind === "OPEN") {
      const hasAdditions = fixedBoardingAdditionsMinor > 0;
      return {
        mode,
        isLegacy: false,
        currency,
        budgetKind,
        isNegotiable,
        unitType,
        totalUnitsCount: nights,
        serviceDaysCount: nights + 1,
        unitRateMinor: null,
        unitMaxRateMinor: null,
        careFeeSubtotalMinor: null,
        careFeeMaxSubtotalMinor: null,
        travelMode: "NONE",
        fixedTravelPerVisitMinor: 0,
        travelFeeSubtotalMinor: 0,
        fixedBoardingAdditionsMinor,
        isEstimateReady: hasAdditions,
        estimatedTotalMinMinor: hasAdditions ? fixedBoardingAdditionsMinor : null,
        estimatedTotalMaxMinor: null,
        statusNote: hasAdditions ? "EXCLUDING_CARE" : null,
      };
    }

    if (budgetKind === "RANGE") {
      const careUnitMin = rawMin ?? 0;
      const careUnitMax = rawMax ?? careUnitMin;
      const careFeeSubtotalMin = careUnitMin * nights;
      const careFeeSubtotalMax = careUnitMax * nights;
      const estimatedTotalMin = careFeeSubtotalMin + fixedBoardingAdditionsMinor;
      const estimatedTotalMax = careFeeSubtotalMax + fixedBoardingAdditionsMinor;
      const isReady = careUnitMin > 0 && careUnitMax > careUnitMin;

      return {
        mode,
        isLegacy: false,
        currency,
        budgetKind,
        isNegotiable,
        unitType,
        totalUnitsCount: nights,
        serviceDaysCount: nights + 1,
        unitRateMinor: careUnitMin,
        unitMaxRateMinor: careUnitMax,
        careFeeSubtotalMinor: careFeeSubtotalMin,
        careFeeMaxSubtotalMinor: careFeeSubtotalMax,
        travelMode: "NONE",
        fixedTravelPerVisitMinor: 0,
        travelFeeSubtotalMinor: 0,
        fixedBoardingAdditionsMinor,
        isEstimateReady: isReady,
        estimatedTotalMinMinor: isReady ? estimatedTotalMin : null,
        estimatedTotalMaxMinor: isReady ? estimatedTotalMax : null,
        statusNote: null,
      };
    }

    // EXACT
    const careUnit = rawMin ?? 0;
    const careFeeSubtotal = careUnit * nights;
    const estimatedTotal = careFeeSubtotal + fixedBoardingAdditionsMinor;
    const isReady = careUnit > 0;

    return {
      mode,
      isLegacy: false,
      currency,
      budgetKind,
      isNegotiable,
      unitType,
      totalUnitsCount: nights,
      serviceDaysCount: nights + 1,
      unitRateMinor: careUnit,
      unitMaxRateMinor: null,
      careFeeSubtotalMinor: careFeeSubtotal,
      careFeeMaxSubtotalMinor: null,
      travelMode: "NONE",
      fixedTravelPerVisitMinor: 0,
      travelFeeSubtotalMinor: 0,
      fixedBoardingAdditionsMinor,
      isEstimateReady: isReady,
      estimatedTotalMinMinor: isReady ? estimatedTotal : null,
      estimatedTotalMaxMinor: null,
      statusNote: null,
    };
  }

  // 3. CUSTOM
  const unitType = "total" as const;
  if (budgetKind === "OPEN") {
    return {
      mode,
      isLegacy,
      currency,
      budgetKind,
      isNegotiable,
      unitType,
      totalUnitsCount: 1,
      serviceDaysCount: 1,
      unitRateMinor: null,
      unitMaxRateMinor: null,
      careFeeSubtotalMinor: null,
      careFeeMaxSubtotalMinor: null,
      travelMode: "NONE",
      fixedTravelPerVisitMinor: 0,
      travelFeeSubtotalMinor: 0,
      fixedBoardingAdditionsMinor: 0,
      isEstimateReady: false,
      estimatedTotalMinMinor: null,
      estimatedTotalMaxMinor: null,
      statusNote: null,
    };
  }

  if (budgetKind === "RANGE") {
    const careUnitMin = rawMin ?? 0;
    const careUnitMax = rawMax ?? careUnitMin;
    const isReady = careUnitMin > 0 && careUnitMax > careUnitMin;
    return {
      mode,
      isLegacy,
      currency,
      budgetKind,
      isNegotiable,
      unitType,
      totalUnitsCount: 1,
      serviceDaysCount: 1,
      unitRateMinor: careUnitMin,
      unitMaxRateMinor: careUnitMax,
      careFeeSubtotalMinor: careUnitMin,
      careFeeMaxSubtotalMinor: careUnitMax,
      travelMode: "NONE",
      fixedTravelPerVisitMinor: 0,
      travelFeeSubtotalMinor: 0,
      fixedBoardingAdditionsMinor: 0,
      isEstimateReady: isReady,
      estimatedTotalMinMinor: isReady ? careUnitMin : null,
      estimatedTotalMaxMinor: isReady ? careUnitMax : null,
      statusNote: null,
    };
  }

  // EXACT
  const careUnit = rawMin ?? 0;
  const isReady = careUnit > 0;
  return {
    mode,
    isLegacy,
    currency,
    budgetKind,
    isNegotiable,
    unitType,
    totalUnitsCount: 1,
    serviceDaysCount: 1,
    unitRateMinor: careUnit,
    unitMaxRateMinor: null,
    careFeeSubtotalMinor: careUnit,
    careFeeMaxSubtotalMinor: null,
    travelMode: "NONE",
    fixedTravelPerVisitMinor: 0,
    travelFeeSubtotalMinor: 0,
    fixedBoardingAdditionsMinor: 0,
    isEstimateReady: isReady,
    estimatedTotalMinMinor: isReady ? careUnit : null,
    estimatedTotalMaxMinor: null,
    statusNote: null,
  };
}

export function formatMoneyAmount(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const divisor = currency === "JPY" || currency === "KRW" ? 1 : 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: divisor === 1 ? 0 : 2,
  }).format(amount / divisor);
}

/**
 * Format badge price for Marketplace Cards and Map Markers (e.g. JP¥54,400 or JP¥54,400–JP¥68,000 or 可协商)
 */
export function formatNeedEstimatedBadge(
  pricing: NeedPricingSummary,
  fallback: string = "可协商",
): string {
  if (!pricing.isEstimateReady || pricing.estimatedTotalMinMinor === null) {
    return fallback;
  }

  const minFormatted = formatMoneyAmount(pricing.estimatedTotalMinMinor, pricing.currency);
  if (pricing.budgetKind === "RANGE" && pricing.estimatedTotalMaxMinor !== null) {
    const maxFormatted = formatMoneyAmount(pricing.estimatedTotalMaxMinor, pricing.currency);
    return `${minFormatted} – ${maxFormatted}`;
  }

  return minFormatted;
}
