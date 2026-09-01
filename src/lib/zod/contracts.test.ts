import { describe, expect, it } from "vitest";

import { mapLocationSchema, toPublicMapLocation } from "./location";
import { moneyOfferSchema } from "./money";

describe("location contract", () => {
  it("accepts only the minimal map location fields", () => {
    expect(
      mapLocationSchema.parse({
        lat: 35.681236,
        lon: 139.767125,
        regionLabel: "Tokyo Station area",
        displayPrecision: "MAP_POINT",
      }),
    ).toMatchObject({ lat: 35.681236, lon: 139.767125 });
  });

  it("rejects unknown precise-location fields and detailed labels", () => {
    const legacyKey = ["address", "Raw"].join("");
    expect(() => mapLocationSchema.parse({ lat: 35, lon: 139, [legacyKey]: "hidden" })).toThrow();
    const detailedLabel = ["12", "号", "3", "室"].join("");
    expect(() => mapLocationSchema.parse({ lat: 35, lon: 139, regionLabel: detailedLabel })).toThrow(
      "PRECISE_LOCATION_TEXT_NOT_ALLOWED",
    );
  });

  it("creates a minimized public location", () => {
    expect(
      toPublicMapLocation({ lat: 35.681236, lon: 139.767125, displayPrecision: "MAP_POINT" }),
    ).toEqual({ approximateLat: 35.68, approximateLon: 139.77, displayPrecision: "NEIGHBORHOOD" });
  });
});

describe("money contract", () => {
  it("rejects an inverted range", () => {
    expect(() =>
      moneyOfferSchema.parse({ kind: "RANGE", minAmountMinor: 2000, maxAmountMinor: 1000, currency: "JPY" }),
    ).toThrow("INVALID_MONEY_RANGE");
  });
});
