import type { BudgetDraft, CareType, SupplyCostMode } from "@/domain/publishing/legacy-need-draft-v3";
import type { NeedPricingInput } from "./pricing";

function nextDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function intervalDays(value: string, custom: number) {
  if (value === "every-2-days") return 2;
  if (value === "every-3-days") return 3;
  if (value === "custom") return Math.max(1, custom || 1);
  return 1;
}

function minorAmount(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const decimals = currency === "JPY" || currency === "KRW" ? 0 : 2;
  return Math.round(amount * 10 ** decimals);
}

function costMode(value: BudgetDraft["travelMode"]): "NONE" | "FIXED" | "ACTUAL" | "DISCUSS" {
  return value === "fixed" ? "FIXED" : value === "actual" ? "ACTUAL" : value === "discuss" ? "DISCUSS" : "NONE";
}

function supplyMode(value: SupplyCostMode): "FIXED" | "ACTUAL" | "DISCUSS" {
  return value === "fixed" ? "FIXED" : value === "reimburse" ? "ACTUAL" : "DISCUSS";
}

/** Build the single pricing-engine input used by Budget, Preview and reads. */
export function pricingInputFromDraft({
  careType,
  dates,
  budget,
  visitFrequency,
  customInterval,
  firstVisitDate,
  visitsPerDay,
  transport,
  sitterSupplyCount,
  supplyCostMode,
}: {
  careType: CareType;
  dates: { startDate: string; endDate: string };
  budget: BudgetDraft;
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  visitsPerDay: number;
  transport: string;
  sitterSupplyCount: number;
  supplyCostMode: SupplyCostMode;
}): NeedPricingInput {
  const mode = careType === "visit" ? "HOME_VISIT" : careType === "boarding" ? "BOARDING" : "CUSTOM";
  const startsAt = `${dates.startDate}T00:00:00.000Z`;
  const endsAt = nextDate(dates.endDate);
  const input: NeedPricingInput = {
    mode,
    startsAt,
    endsAt,
    budget: {
      kind: budget.mode === "range" ? "RANGE" : budget.mode === "open" ? "OPEN" : "EXACT",
      minAmountMinor: budget.mode === "open" ? null : minorAmount(budget.amount, budget.currency),
      maxAmountMinor: budget.mode === "range" ? minorAmount(budget.maximum, budget.currency) : null,
      currency: budget.currency,
      negotiable: budget.exactNegotiable,
    },
    additionalCosts: [],
  };

  if (careType === "visit" && budget.travelMode !== "none") {
    input.additionalCosts?.push({
      kind: "TRAVEL",
      mode: costMode(budget.travelMode),
      amountMinor: budget.travelMode === "fixed" ? minorAmount(budget.travelAmount, budget.currency) : null,
    });
  }
  if (careType === "boarding" && sitterSupplyCount > 0) {
    input.additionalCosts?.push({
      kind: "SUPPLY",
      mode: supplyMode(supplyCostMode),
      amountMinor: supplyCostMode === "fixed" ? minorAmount(budget.supplyAmount, budget.currency) : null,
    });
  }
  if (careType === "boarding" && (transport === "sitter" || transport === "split") && budget.travelMode !== "none") {
    input.additionalCosts?.push({
      kind: "TRAVEL",
      mode: costMode(budget.travelMode),
      amountMinor: budget.travelMode === "fixed" ? minorAmount(budget.travelAmount, budget.currency) : null,
    });
  }

  if (careType === "visit") {
    input.schedule = {
      homeVisit: {
        intervalDays: intervalDays(visitFrequency, customInterval),
        firstServiceDate: firstVisitDate || dates.startDate,
        visitsPerServiceDay: visitsPerDay,
      },
    };
  } else if (careType === "boarding") {
    input.schedule = { boarding: {} };
  } else {
    input.schedule = { custom: {} };
  }
  return input;
}
