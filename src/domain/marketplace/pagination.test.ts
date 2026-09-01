import { describe, expect, it } from "vitest";

import {
  compareMarketplaceItems,
  decodeMarketplaceCursor,
  encodeMarketplaceCursor,
  haversineDistanceMeters,
  isAfterCursor,
  withinBudget,
  isPublicNeedAt,
} from "./pagination";

describe("marketplace pagination and filters", () => {
  it("round-trips an opaque cursor and rejects damaged input", () => {
    const cursor = { createdAt: "2026-08-04T00:00:00.000Z", source: "V2" as const, id: "need-1" };
    expect(decodeMarketplaceCursor(encodeMarketplaceCursor(cursor))).toEqual(cursor);
    expect(decodeMarketplaceCursor("not-a-cursor")).toBeNull();
  });

  it("orders equal timestamps deterministically by ID", () => {
    const createdAt = new Date("2026-08-04T00:00:00.000Z");
    const items = [
      { createdAt, source: "V2" as const, id: "a" },
      { createdAt, source: "V2" as const, id: "z" },
    ].sort(compareMarketplaceItems);
    expect(items.map((item) => `${item.source}:${item.id}`)).toEqual([
      "V2:z",
      "V2:a",
    ]);
    const cursor = { createdAt: createdAt.toISOString(), source: "V2" as const, id: "a" };
    expect(isAfterCursor(items[0], cursor)).toBe(false);
    expect(isAfterCursor(items[1], cursor)).toBe(false);
  });

  it("calculates distance without returning coordinates and applies radius boundaries", () => {
    const meters = haversineDistanceMeters(
      { lat: 35.681236, lon: 139.767125 },
      { lat: 35.6895, lon: 139.6917 },
    );
    expect(meters).toBeGreaterThan(6000);
    expect(meters).toBeLessThan(8000);
  });

  it("uses range overlap semantics and excludes open prices from numeric filters", () => {
    expect(withinBudget(
      { kind: "RANGE", minAmountMinor: 5000, maxAmountMinor: 9000, currency: "JPY" },
      { currency: "JPY", minAmountMinor: 8000, maxAmountMinor: 10000 },
    )).toBe(true);
    expect(withinBudget(
      { kind: "EXACT", minAmountMinor: 12000, maxAmountMinor: null, currency: "JPY" },
      { maxAmountMinor: 10000 },
    )).toBe(false);
    expect(withinBudget(
      { kind: "OPEN", minAmountMinor: null, maxAmountMinor: null, currency: "JPY" },
      { maxAmountMinor: 10000 },
    )).toBe(false);
  });

  it("treats the need end instant as the exclusive public boundary", () => {
    const now = new Date("2026-08-04T12:00:00.000Z");
    expect(isPublicNeedAt({ state: "OPEN", endsAt: new Date("2026-08-04T12:00:00.001Z"), archivedAt: null }, now)).toBe(true);
    expect(isPublicNeedAt({ state: "OPEN", endsAt: now, archivedAt: null }, now)).toBe(false);
    expect(isPublicNeedAt({ state: "MATCHED", endsAt: new Date("2026-08-05T00:00:00.000Z"), archivedAt: null }, now)).toBe(false);
  });
});
