import { haversineDistanceMeters } from "@/domain/marketplace/pagination";

export type MatchMode = "HOME_VISIT" | "BOARDING" | "CUSTOM";
export type MatchTier = "EXACT" | "PET_FALLBACK" | "NEARBY" | "NONE";

export type MatchLocation = { lat: number; lon: number };

export type MatchAvailabilityRule =
  | { kind: "WEEKLY"; weekdays: number[]; startsOn?: string | null; endsOn?: string | null }
  | { kind: "DATE_RANGE"; weekdays?: number[]; startsOn: string; endsOn: string };

export type MatchAvailabilityException = { date: string; available: boolean };

export type NeedMatchInput = {
  publicId: string;
  ownerId: string;
  mode: MatchMode;
  startsAt: Date;
  endsAt: Date;
  location: MatchLocation;
  petTypes: string[];
  taskCategories: string[];
  currency: string;
  budgetKind: "EXACT" | "RANGE" | "OPEN";
  minAmountMinor: number | null;
  maxAmountMinor: number | null;
  homeVisitIntervalDays?: number | null;
  excludedDates?: string[];
  maxProviderDistanceMeters?: number | null;
  isPublic: boolean;
};

export type ServiceMatchInput = {
  publicId: string;
  providerId: string;
  mode: MatchMode;
  location: MatchLocation;
  serviceRadiusMeters: number | null;
  petTypes: string[];
  offeringCategories: string[];
  currency: string;
  priceAmountsMinor: number[];
  availabilityRules: MatchAvailabilityRule[];
  availabilityExceptions: MatchAvailabilityException[];
  isPublic: boolean;
};

export type MatchRecommendation = {
  publicId: string;
  tier: Exclude<MatchTier, "NONE">;
  score: number;
  distanceMeters: number;
  reasons: string[];
  relaxedCriteria: string[];
};

export type MatchRecommendationResult = {
  tier: MatchTier;
  items: MatchRecommendation[];
  evaluatedCandidates: number;
  message: string;
};

type Evaluation = {
  distanceMeters: number;
  mode: boolean;
  pets: boolean;
  tasks: boolean;
  time: boolean;
  distance: boolean;
  budget: boolean;
};

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function requiredDateKeys(need: NeedMatchInput) {
  const start = new Date(Date.UTC(
    need.startsAt.getUTCFullYear(),
    need.startsAt.getUTCMonth(),
    need.startsAt.getUTCDate(),
  ));
  const end = new Date(Date.UTC(
    need.endsAt.getUTCFullYear(),
    need.endsAt.getUTCMonth(),
    need.endsAt.getUTCDate(),
  ));
  const interval = need.mode === "HOME_VISIT"
    ? Math.max(1, need.homeVisitIntervalDays ?? 1)
    : 1;
  const excluded = new Set(need.excludedDates ?? []);
  const dates: string[] = [];
  let offset = 0;
  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 86_400_000)) {
    const key = dateKey(cursor);
    if (offset % interval === 0 && !excluded.has(key)) dates.push(key);
    offset += 1;
  }
  return dates;
}

function availableOn(service: ServiceMatchInput, date: string) {
  const exception = service.availabilityExceptions.find((item) => item.date === date);
  if (exception) return exception.available;
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay() || 7;
  return service.availabilityRules.some((rule) => {
    if (rule.kind === "DATE_RANGE") return date >= rule.startsOn && date <= rule.endsOn;
    const insideRange = (!rule.startsOn || date >= rule.startsOn) && (!rule.endsOn || date <= rule.endsOn);
    return insideRange && rule.weekdays.includes(weekday);
  });
}

function coversAll(required: string[], offered: string[]) {
  const available = new Set(unique(offered).map((item) => item.toUpperCase()));
  return unique(required).every((item) => available.has(item.toUpperCase()));
}

function budgetMatches(need: NeedMatchInput, service: ServiceMatchInput) {
  if (need.budgetKind === "OPEN") return true;
  if (need.currency !== service.currency || service.priceAmountsMinor.length === 0) return false;
  const budgetCeiling = need.budgetKind === "RANGE"
    ? need.maxAmountMinor
    : need.minAmountMinor;
  if (budgetCeiling === null) return false;
  return Math.min(...service.priceAmountsMinor) <= budgetCeiling;
}

export function evaluateNeedServiceMatch(
  need: NeedMatchInput,
  service: ServiceMatchInput,
): Evaluation {
  const distanceMeters = haversineDistanceMeters(need.location, service.location);
  const distance =
    (service.mode === "BOARDING" || service.serviceRadiusMeters === null || distanceMeters <= service.serviceRadiusMeters) &&
    (need.mode !== "BOARDING" || need.maxProviderDistanceMeters === null || need.maxProviderDistanceMeters === undefined || distanceMeters <= need.maxProviderDistanceMeters);
  return {
    distanceMeters,
    mode: need.mode === service.mode,
    pets: coversAll(need.petTypes, service.petTypes),
    tasks: coversAll(need.taskCategories, service.offeringCategories),
    time: requiredDateKeys(need).every((date) => availableOn(service, date)),
    distance,
    budget: budgetMatches(need, service),
  };
}

function recommendation(
  publicId: string,
  tier: Exclude<MatchTier, "NONE">,
  evaluation: Evaluation,
): MatchRecommendation {
  const reasons = [
    ...(evaluation.pets ? ["可照顾需求中的全部宠物类型"] : []),
    ...(evaluation.mode ? ["服务模式一致"] : []),
    ...(evaluation.time ? ["所需日期均在可服务时间内"] : []),
    ...(evaluation.distance ? [`距离约 ${evaluation.distanceMeters} 米，符合服务范围`] : []),
    ...(evaluation.tasks ? ["所需任务均有对应服务内容"] : []),
    ...(evaluation.budget ? ["公开价格与预算可比较且未超出预算"] : []),
  ];
  const relaxedCriteria = tier === "PET_FALLBACK"
    ? ["服务模式或任务类别可能不同，请在咨询时确认具体照护内容"]
    : tier === "NEARBY"
      ? ["仅按附近位置推荐，宠物、模式、时间、任务和预算尚未确认"]
      : [];
  const passed = [evaluation.mode, evaluation.pets, evaluation.tasks, evaluation.time, evaluation.distance, evaluation.budget]
    .filter(Boolean).length;
  return {
    publicId,
    tier,
    score: passed * 100 - Math.min(evaluation.distanceMeters, 100_000) / 1000,
    distanceMeters: evaluation.distanceMeters,
    reasons,
    relaxedCriteria,
  };
}

function orderAndLimit(items: MatchRecommendation[], limit: number) {
  return items
    .sort((left, right) => right.score - left.score || left.publicId.localeCompare(right.publicId))
    .slice(0, Math.max(1, limit));
}

export function recommendServicesForNeed(
  need: NeedMatchInput,
  services: ServiceMatchInput[],
  options: { limit?: number } = {},
): MatchRecommendationResult {
  const candidates = services.filter((service) => service.isPublic && service.providerId !== need.ownerId);
  const evaluated = candidates.map((service) => ({ service, evaluation: evaluateNeedServiceMatch(need, service) }));
  const exact = evaluated
    .filter(({ evaluation }) => evaluation.mode && evaluation.pets && evaluation.tasks && evaluation.time && evaluation.distance && evaluation.budget)
    .map(({ service, evaluation }) => recommendation(service.publicId, "EXACT", evaluation));
  if (exact.length) {
    return {
      tier: "EXACT",
      items: orderAndLimit(exact, options.limit ?? 6),
      evaluatedCandidates: candidates.length,
      message: "已找到同时符合模式、宠物、时间、距离、任务和预算的服务。",
    };
  }
  const petFallback = evaluated
    .filter(({ evaluation }) => evaluation.pets && evaluation.time && evaluation.distance && evaluation.budget)
    .map(({ service, evaluation }) => recommendation(service.publicId, "PET_FALLBACK", evaluation));
  if (petFallback.length) {
    return {
      tier: "PET_FALLBACK",
      items: orderAndLimit(petFallback, options.limit ?? 6),
      evaluatedCandidates: candidates.length,
      message: "暂无精确匹配；以下服务可照顾相同宠物，但服务模式或任务类别可能不同。",
    };
  }
  return {
    tier: "NONE",
    items: [],
    evaluatedCandidates: candidates.length,
    message: "暂未找到符合当前宠物、时间、距离和预算条件的公开服务。",
  };
}

export function recommendNeedsForService(
  service: ServiceMatchInput,
  needs: NeedMatchInput[],
  options: { limit?: number; nearbyRadiusMeters?: number } = {},
): MatchRecommendationResult {
  const candidates = needs.filter((need) => need.isPublic && need.ownerId !== service.providerId);
  const evaluated = candidates.map((need) => ({ need, evaluation: evaluateNeedServiceMatch(need, service) }));
  const exact = evaluated
    .filter(({ evaluation }) => evaluation.mode && evaluation.pets && evaluation.tasks && evaluation.time && evaluation.distance && evaluation.budget)
    .map(({ need, evaluation }) => recommendation(need.publicId, "EXACT", evaluation));
  if (exact.length) {
    return {
      tier: "EXACT",
      items: orderAndLimit(exact, options.limit ?? 6),
      evaluatedCandidates: candidates.length,
      message: "已找到与服务模式、宠物、时间、距离、任务和价格相符的需求。",
    };
  }
  const nearbyRadiusMeters = options.nearbyRadiusMeters ?? 50_000;
  const nearby = evaluated
    .filter(({ evaluation }) => evaluation.distanceMeters <= nearbyRadiusMeters)
    .map(({ need, evaluation }) => recommendation(need.publicId, "NEARBY", evaluation));
  if (nearby.length) {
    return {
      tier: "NEARBY",
      items: orderAndLimit(nearby, options.limit ?? 6),
      evaluatedCandidates: candidates.length,
      message: "暂无精确匹配；以下是 50 公里内仍公开的需求，其他条件需要逐项确认。",
    };
  }
  return {
    tier: "NONE",
    items: [],
    evaluatedCandidates: candidates.length,
    message: "暂未找到匹配或附近的公开需求。",
  };
}
