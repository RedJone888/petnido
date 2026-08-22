import type { z } from "zod";

import type { ServiceForm } from "@/lib/zod/services";
import { serviceDraftPayloadSchema } from "./contracts";

export type ServiceDraftPayload = z.infer<typeof serviceDraftPayloadSchema>;

type SupportedCurrency = "JPY" | "USD" | "EUR" | "CNY" | "TWD" | "KRW" | "GBP";

const currencyDecimals: Record<SupportedCurrency, number> = {
  JPY: 0,
  KRW: 0,
  USD: 2,
  EUR: 2,
  CNY: 2,
  TWD: 2,
  GBP: 2,
};

function modeFor(serviceType: ServiceForm["serviceType"]) {
  if (serviceType === "VISIT") return "HOME_VISIT" as const;
  if (serviceType === "FOSTER") return "BOARDING" as const;
  return "CUSTOM" as const;
}

function weekdaysFor(pattern: ServiceForm["availabilityWeekPattern"]) {
  if (pattern === "WEEKDAYS_ONLY") return [1, 2, 3, 4, 5];
  if (pattern === "WEEKENDS_ONLY") return [6, 7];
  return [1, 2, 3, 4, 5, 6, 7];
}

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function amountMinor(value: string, currency: SupportedCurrency) {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 10 ** currencyDecimals[currency]);
}

export function mapLegacyServiceFormV1(
  form: ServiceForm,
  timeZone: string,
  options: { locationConfirmed: boolean },
): {
  mode: "HOME_VISIT" | "BOARDING" | "CUSTOM";
  payload: ServiceDraftPayload;
} {
  const mode = modeFor(form.serviceType);
  const currency = form.currency as SupportedCurrency;
  const hasLocation =
    options.locationConfirmed &&
    Number.isFinite(form.areaLat) &&
    Number.isFinite(form.areaLon) &&
    form.areaLat >= -90 &&
    form.areaLat <= 90 &&
    form.areaLon >= -180 &&
    form.areaLon <= 180;
  const from = validDate(form.availableFrom);
  const to = validDate(form.availableTo);
  const availabilityRules =
    form.availabilityRangeType === "DATE_RANGE"
      ? from && to
        ? [
            {
              kind: "DATE_RANGE" as const,
              weekdays: [],
              startsOn: from,
              endsOn: to,
              includesHolidays: form.includeHolidays,
            },
          ]
        : []
      : [
          {
            kind: "WEEKLY" as const,
            weekdays: weekdaysFor(form.availabilityWeekPattern),
            startsOn: null,
            endsOn: null,
            includesHolidays: form.includeHolidays,
          },
        ];
  const title =
    mode === "CUSTOM" && form.customType?.trim()
      ? form.customType.trim()
      : mode === "HOME_VISIT"
        ? "Home visit care"
        : "Boarding care";

  const payload: ServiceDraftPayload = {
    title,
    description: form.description?.trim() || null,
    timeZone,
    ...(hasLocation
      ? {
          location: {
            lat: form.areaLat,
            lon: form.areaLon,
            regionLabel: null,
            displayPrecision: "MAP_POINT" as const,
          },
        }
      : {}),
    currency,
    availabilityRules,
    availabilityExceptions: [],
    petPolicies: [],
    offerings: [],
    priceRules: form.priceRules.flatMap((rule) => {
      const amount = amountMinor(rule.price, currency);
      const label = rule.groupLabel.trim();
      if (!label || amount === null) return [];
      return [
        {
          label,
          unit: form.priceUnit,
          amountMinor: amount,
        },
      ];
    }),
    discounts: [],
    attachmentIds: form.photos.map((photo) => photo.id).filter(Boolean),
    ...(mode === "HOME_VISIT"
      ? { homeVisit: {} }
      : mode === "BOARDING"
        ? { boarding: {} }
        : { custom: {} }),
  };

  return { mode, payload: serviceDraftPayloadSchema.parse(payload) };
}
