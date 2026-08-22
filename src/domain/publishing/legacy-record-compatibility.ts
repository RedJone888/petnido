export type PublishMode = "HOME_VISIT" | "BOARDING" | "CUSTOM";

export type CompatibilityIssueCode =
  | "INVALID_COORDINATES"
  | "INVALID_DATE_RANGE"
  | "PET_DETAILS_REQUIRE_CONFIRMATION"
  | "TASKS_REQUIRE_STRUCTURED_CONFIRMATION"
  | "MONEY_SEMANTICS_REQUIRE_CONFIRMATION"
  | "AVAILABILITY_REQUIRES_CONFIRMATION"
  | "PET_POLICIES_REQUIRE_CONFIRMATION"
  | "OFFERINGS_REQUIRE_CONFIRMATION"
  | "HOME_VISIT_RADIUS_REQUIRED"
  | "BOARDING_CAPACITY_REQUIRED"
  | "BOARDING_ENVIRONMENT_REQUIRED";

export const legacyNeedCompatibilitySelect = {
  id: true,
  title: true,
  category: true,
  status: true,
  startDate: true,
  endDate: true,
  addressLat: true,
  addressLon: true,
  currency: true,
  totalPrice: true,
  needPets: {
    select: {
      id: true,
      petCategory: true,
      petType: true,
      count: true,
      petIds: true,
    },
  },
} as const;

export const legacyServiceCompatibilitySelect = {
  id: true,
  serviceType: true,
  customType: true,
  isActive: true,
  areaLat: true,
  areaLon: true,
  currency: true,
  availabilityRangeType: true,
  availabilityWeekPattern: true,
  includeHolidays: true,
  availableFrom: true,
  availableTo: true,
  priceUnit: true,
  priceRules: { select: { groupLabel: true, price: true } },
  photos: {
    where: { status: 1 },
    orderBy: { order: "asc" as const },
    select: { id: true },
  },
} as const;

type LegacyNeed = {
  id: string;
  title: string;
  category: "VISIT" | "FOSTER" | "OTHER";
  status: "OPEN" | "MATCHED" | "CLOSED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  addressLat: number;
  addressLon: number;
  currency: SupportedCurrency;
  totalPrice: number;
  needPets: Array<{
    id: string;
    petCategory: string;
    petType: string | null;
    count: number;
    petIds: string[];
  }>;
};

type LegacyService = {
  id: string;
  serviceType: "VISIT" | "FOSTER" | "OTHER";
  customType: string | null;
  isActive: boolean;
  areaLat: number;
  areaLon: number;
  currency: SupportedCurrency;
  availabilityRangeType: "LONG_TERM" | "DATE_RANGE";
  availabilityWeekPattern: "EVERYDAY" | "WEEKDAYS_ONLY" | "WEEKENDS_ONLY";
  includeHolidays: boolean;
  availableFrom: Date | null;
  availableTo: Date | null;
  priceUnit: "DAY" | "HOUR" | "VISIT";
  priceRules: Array<{ groupLabel: string; price: number }>;
  photos: Array<{ id: string }>;
};

type SupportedCurrency = "JPY" | "USD" | "EUR" | "CNY" | "TWD" | "KRW" | "GBP";

const zeroDecimalCurrencies = new Set<SupportedCurrency>(["JPY", "KRW"]);

function modeFor(category: "VISIT" | "FOSTER" | "OTHER"): PublishMode {
  if (category === "VISIT") return "HOME_VISIT";
  if (category === "FOSTER") return "BOARDING";
  return "CUSTOM";
}

function validCoordinates(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function amountMinor(value: number, currency: SupportedCurrency) {
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * (zeroDecimalCurrencies.has(currency) ? 1 : 100));
}

function weekdaysFor(pattern: LegacyService["availabilityWeekPattern"]) {
  if (pattern === "WEEKDAYS_ONLY") return [1, 2, 3, 4, 5];
  if (pattern === "WEEKENDS_ONLY") return [6, 7];
  return [1, 2, 3, 4, 5, 6, 7];
}

export function assessLegacyNeedCompatibility(need: LegacyNeed) {
  const issues: CompatibilityIssueCode[] = [
    "PET_DETAILS_REQUIRE_CONFIRMATION",
    "TASKS_REQUIRE_STRUCTURED_CONFIRMATION",
    "MONEY_SEMANTICS_REQUIRE_CONFIRMATION",
  ];
  if (!validCoordinates(need.addressLat, need.addressLon)) issues.push("INVALID_COORDINATES");
  if (need.startDate >= need.endDate) issues.push("INVALID_DATE_RANGE");
  return {
    kind: "NEED" as const,
    sourceId: need.id,
    mode: modeFor(need.category),
    canAutoPublish: false,
    issues,
    safeCandidate: {
      title: need.title,
      state: need.status,
      startsAt: need.startDate.toISOString(),
      endsAt: need.endDate.toISOString(),
      ...(validCoordinates(need.addressLat, need.addressLon)
        ? {
            location: {
              lat: need.addressLat,
              lon: need.addressLon,
              regionLabel: null,
              displayPrecision: "MAP_POINT" as const,
            },
          }
        : {}),
      budget: {
        kind: "EXACT" as const,
        minAmountMinor: amountMinor(need.totalPrice, need.currency),
        maxAmountMinor: null,
        currency: need.currency,
      },
      pets: need.needPets.map((pet) => ({
        sourceLegacyPetKey: pet.id,
        petType: pet.petType || pet.petCategory,
        quantity: pet.count,
        sourcePetIds: pet.petIds,
      })),
    },
  };
}

export function assessLegacyServiceCompatibility(service: LegacyService) {
  const mode = modeFor(service.serviceType);
  const issues: CompatibilityIssueCode[] = [
    "AVAILABILITY_REQUIRES_CONFIRMATION",
    "PET_POLICIES_REQUIRE_CONFIRMATION",
    "OFFERINGS_REQUIRE_CONFIRMATION",
    "MONEY_SEMANTICS_REQUIRE_CONFIRMATION",
  ];
  if (!validCoordinates(service.areaLat, service.areaLon)) issues.push("INVALID_COORDINATES");
  if (mode === "HOME_VISIT") issues.push("HOME_VISIT_RADIUS_REQUIRED");
  if (mode === "BOARDING") {
    issues.push("BOARDING_CAPACITY_REQUIRED", "BOARDING_ENVIRONMENT_REQUIRED");
  }
  const availabilityRule = service.availabilityRangeType === "DATE_RANGE"
    ? service.availableFrom && service.availableTo && service.availableFrom <= service.availableTo
      ? {
          kind: "DATE_RANGE" as const,
          weekdays: [],
          startsOn: service.availableFrom.toISOString().slice(0, 10),
          endsOn: service.availableTo.toISOString().slice(0, 10),
          includesHolidays: service.includeHolidays,
        }
      : null
    : {
        kind: "WEEKLY" as const,
        weekdays: weekdaysFor(service.availabilityWeekPattern),
        startsOn: null,
        endsOn: null,
        includesHolidays: service.includeHolidays,
      };
  return {
    kind: "SERVICE" as const,
    sourceId: service.id,
    mode,
    canAutoPublish: false,
    issues,
    safeCandidate: {
      title: mode === "CUSTOM" && service.customType?.trim()
        ? service.customType.trim()
        : mode === "HOME_VISIT"
          ? "Home visit care"
          : "Boarding care",
      state: service.isActive ? "ACTIVE" as const : "PAUSED" as const,
      ...(validCoordinates(service.areaLat, service.areaLon)
        ? {
            location: {
              lat: service.areaLat,
              lon: service.areaLon,
              regionLabel: null,
              displayPrecision: "MAP_POINT" as const,
            },
          }
        : {}),
      currency: service.currency,
      availabilityRules: availabilityRule ? [availabilityRule] : [],
      priceRules: service.priceRules.flatMap((rule) => {
        const minor = amountMinor(rule.price, service.currency);
        return rule.groupLabel.trim() && minor !== null
          ? [{ label: rule.groupLabel.trim(), unit: service.priceUnit, amountMinor: minor }]
          : [];
      }),
      attachmentIds: service.photos.map((photo) => photo.id),
    },
  };
}

export const compatibilityIssueLabels: Record<CompatibilityIssueCode, string> = {
  INVALID_COORDINATES: "The old map point is invalid and must be selected again.",
  INVALID_DATE_RANGE: "The old date range is invalid and must be corrected.",
  PET_DETAILS_REQUIRE_CONFIRMATION: "Confirm each pet and its current care details.",
  TASKS_REQUIRE_STRUCTURED_CONFIRMATION: "Convert the old free-text request into structured tasks.",
  MONEY_SEMANTICS_REQUIRE_CONFIRMATION: "Confirm that the old displayed amount and unit are still correct.",
  AVAILABILITY_REQUIRES_CONFIRMATION: "Confirm the converted availability and add date exceptions if needed.",
  PET_POLICIES_REQUIRE_CONFIRMATION: "Choose explicit pet type, size and age policies.",
  OFFERINGS_REQUIRE_CONFIRMATION: "Describe the specific services provided.",
  HOME_VISIT_RADIUS_REQUIRED: "Choose a home-visit service radius.",
  BOARDING_CAPACITY_REQUIRED: "Enter the maximum number of pets accepted at one time.",
  BOARDING_ENVIRONMENT_REQUIRED: "Describe the boarding environment, resident pets and supplied items.",
};

export function summarizeCompatibility(
  assessments: Array<{ issues: CompatibilityIssueCode[] }>,
) {
  const counts = Object.fromEntries(
    Object.keys(compatibilityIssueLabels).map((code) => [code, 0]),
  ) as Record<CompatibilityIssueCode, number>;
  for (const assessment of assessments) {
    for (const issue of assessment.issues) counts[issue] += 1;
  }
  return {
    sourceCount: assessments.length,
    autoPublishableCount: 0,
    requiresConfirmationCount: assessments.length,
    issueCounts: counts,
  };
}
