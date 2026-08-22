import { describe, expect, it } from "vitest";

import {
  recommendNeedsForService,
  recommendServicesForNeed,
  type NeedMatchInput,
  type ServiceMatchInput,
} from "./recommendations";

const need: NeedMatchInput = {
  publicId: "v2:need-1",
  ownerId: "owner-1",
  mode: "HOME_VISIT",
  startsAt: new Date("2026-08-10T00:00:00.000Z"),
  endsAt: new Date("2026-08-10T12:00:00.000Z"),
  location: { lat: 35.68, lon: 139.76 },
  petTypes: ["CAT"],
  taskCategories: ["FEEDING"],
  currency: "JPY",
  budgetKind: "EXACT",
  minAmountMinor: 4000,
  maxAmountMinor: null,
  isPublic: true,
};

const service: ServiceMatchInput = {
  publicId: "v2:service-1",
  providerId: "provider-1",
  mode: "HOME_VISIT",
  location: { lat: 35.681, lon: 139.761 },
  serviceRadiusMeters: 5000,
  petTypes: ["CAT"],
  offeringCategories: ["FEEDING"],
  currency: "JPY",
  priceAmountsMinor: [3000],
  availabilityRules: [{ kind: "WEEKLY", weekdays: [1] }],
  availabilityExceptions: [],
  isPublic: true,
};

describe("post-publish recommendations", () => {
  it("returns an exact service match with concrete reasons", () => {
    const result = recommendServicesForNeed(need, [service]);
    expect(result.tier).toBe("EXACT");
    expect(result.items[0]).toMatchObject({ publicId: "v2:service-1", tier: "EXACT", relaxedCriteria: [] });
    expect(result.items[0].reasons).toContain("服务模式一致");
  });

  it("falls back to same-pet services and discloses the relaxed category", () => {
    const result = recommendServicesForNeed(need, [{ ...service, mode: "CUSTOM", offeringCategories: ["PLAY"] }]);
    expect(result.tier).toBe("PET_FALLBACK");
    expect(result.items[0].relaxedCriteria[0]).toContain("可能不同");
  });

  it("falls back to nearby public needs after a service has no exact match", () => {
    const mismatched = { ...need, mode: "BOARDING" as const, petTypes: ["DOG"], taskCategories: ["WALKING"] };
    const result = recommendNeedsForService(service, [mismatched]);
    expect(result.tier).toBe("NEARBY");
    expect(result.items[0]).toMatchObject({ publicId: "v2:need-1", tier: "NEARBY" });
    expect(result.items[0].relaxedCriteria[0]).toContain("仅按附近位置推荐");
  });

  it("returns no result and excludes expired, paused and own content before ranking", () => {
    const result = recommendServicesForNeed(need, [
      { ...service, publicId: "expired", isPublic: false },
      { ...service, publicId: "paused", isPublic: false },
      { ...service, publicId: "own", providerId: "owner-1" },
    ]);
    expect(result).toMatchObject({ tier: "NONE", items: [], evaluatedCandidates: 0 });
  });

  it("does not call a service exact when a required date exception is unavailable", () => {
    const result = recommendServicesForNeed(need, [{
      ...service,
      availabilityExceptions: [{ date: "2026-08-10", available: false }],
    }]);
    expect(result.tier).toBe("NONE");
  });
});
