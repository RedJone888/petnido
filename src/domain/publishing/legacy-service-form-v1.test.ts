import { describe, expect, it } from "vitest";

import type { ServiceForm } from "@/lib/zod/services";
import { createEmptyService } from "@/domain/service/defaults";
import { mapLegacyServiceFormV1 } from "./legacy-service-form-v1";

function form(patch: Partial<ServiceForm> = {}): ServiceForm {
  return {
    ...createEmptyService({} as Parameters<typeof createEmptyService>[0]),
    areaLat: 34.6937,
    areaLon: 135.5023,
    priceRules: [],
    ...patch,
  };
}

describe("legacy service form v1 migration", () => {
  it("maps visit schedule, location and JPY price without persisting raw area text", () => {
    const result = mapLegacyServiceFormV1(
      form({
        availabilityWeekPattern: "WEEKDAYS_ONLY",
        includeHolidays: true,
        priceRules: [{ groupLabel: "Cats", price: "2500" }],
      }),
      "Asia/Tokyo",
      { locationConfirmed: true },
    );

    expect(result.mode).toBe("HOME_VISIT");
    expect(result.payload.location).toEqual({
      lat: 34.6937,
      lon: 135.5023,
      regionLabel: null,
      displayPrecision: "MAP_POINT",
    });
    expect(result.payload.availabilityRules?.[0]).toMatchObject({
      kind: "WEEKLY",
      weekdays: [1, 2, 3, 4, 5],
      includesHolidays: true,
    });
    expect(result.payload.priceRules?.[0]).toMatchObject({
      amountMinor: 2500,
      unit: "VISIT",
    });
    expect(result.payload.location?.regionLabel).toBeNull();
  });

  it("maps USD display amounts to minor units and keeps only meaningful rows", () => {
    const result = mapLegacyServiceFormV1(
      form({
        currency: "USD",
        priceUnit: "HOUR",
        priceRules: [
          { groupLabel: "Small pets", price: "12.50" },
          { groupLabel: "", price: "0" },
        ],
      }),
      "America/New_York",
      { locationConfirmed: true },
    );

    expect(result.payload.priceRules).toEqual([
      { label: "Small pets", unit: "HOUR", amountMinor: 1250 },
    ]);
  });

  it("preserves date-range semantics and mode-specific draft branches", () => {
    const boarding = mapLegacyServiceFormV1(
      form({
        serviceType: "FOSTER",
        availabilityRangeType: "DATE_RANGE",
        availableFrom: "2026-08-10",
        availableTo: "2026-08-20",
      }),
      "Asia/Tokyo",
      { locationConfirmed: true },
    );
    expect(boarding.payload.availabilityRules).toEqual([
      {
        kind: "DATE_RANGE",
        weekdays: [],
        startsOn: "2026-08-10",
        endsOn: "2026-08-20",
        includesHolidays: false,
      },
    ]);
    expect(boarding.payload.boarding).toEqual({});

    const custom = mapLegacyServiceFormV1(
      form({ serviceType: "OTHER", customType: "Vet transport" }),
      "Asia/Tokyo",
      { locationConfirmed: true },
    );
    expect(custom).toMatchObject({
      mode: "CUSTOM",
      payload: { title: "Vet transport", custom: {} },
    });
  });
});
