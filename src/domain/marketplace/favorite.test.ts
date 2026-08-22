import { describe, expect, it } from "vitest";

import {
  favoriteTargetSchema,
  needFavoriteAvailability,
  serviceFavoriteAvailability,
} from "./favorite";

describe("favorites", () => {
  it("parses source-qualified public targets and rejects ambiguous IDs", () => {
    expect(favoriteTargetSchema.parse({ kind: "NEED", publicId: "v2:need-1" })).toEqual({
      kind: "NEED",
      publicId: "v2:need-1",
      source: "V2",
      targetId: "need-1",
    });
    expect(favoriteTargetSchema.safeParse({ kind: "SERVICE", publicId: "service-1" }).success).toBe(false);
  });

  it("retains an expired need as expired rather than unavailable", () => {
    const now = new Date("2026-08-04T00:00:00.000Z");
    expect(needFavoriteAvailability({ state: "OPEN", endsAt: now, archivedAt: null }, now)).toBe("EXPIRED");
    expect(needFavoriteAvailability({ state: "OPEN", endsAt: new Date("2026-08-05T00:00:00.000Z"), archivedAt: null }, now)).toBe("AVAILABLE");
    expect(needFavoriteAvailability({ state: "CANCELLED", endsAt: new Date("2026-08-05T00:00:00.000Z"), archivedAt: null }, now)).toBe("UNAVAILABLE");
  });

  it("marks paused or globally closed services unavailable without deleting the favorite", () => {
    expect(serviceFavoriteAvailability({ active: true, archivedAt: null, providerAccepting: true })).toBe("AVAILABLE");
    expect(serviceFavoriteAvailability({ active: false, archivedAt: null, providerAccepting: true })).toBe("UNAVAILABLE");
    expect(serviceFavoriteAvailability({ active: true, archivedAt: null, providerAccepting: false })).toBe("UNAVAILABLE");
  });
});
