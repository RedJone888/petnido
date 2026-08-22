export type MarketplaceSource = "V2" | "LEGACY";

export type MarketplaceCursor = {
  createdAt: string;
  source: MarketplaceSource;
  id: string;
};

const sourceRank: Record<MarketplaceSource, number> = { V2: 1, LEGACY: 0 };

export function encodeMarketplaceCursor(cursor: MarketplaceCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeMarketplaceCursor(value: string | null | undefined): MarketplaceCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<MarketplaceCursor>;
    if (
      typeof parsed.createdAt !== "string" ||
      Number.isNaN(new Date(parsed.createdAt).valueOf()) ||
      (parsed.source !== "V2" && parsed.source !== "LEGACY") ||
      typeof parsed.id !== "string" ||
      !parsed.id
    ) return null;
    return parsed as MarketplaceCursor;
  } catch {
    return null;
  }
}

export function compareMarketplaceItems(
  left: { createdAt: Date; source: MarketplaceSource; id: string },
  right: { createdAt: Date; source: MarketplaceSource; id: string },
) {
  const date = right.createdAt.valueOf() - left.createdAt.valueOf();
  if (date) return date;
  const source = sourceRank[right.source] - sourceRank[left.source];
  if (source) return source;
  return right.id.localeCompare(left.id);
}

export function isAfterCursor(
  item: { createdAt: Date; source: MarketplaceSource; id: string },
  cursor: MarketplaceCursor | null,
) {
  if (!cursor) return true;
  return compareMarketplaceItems(item, {
    createdAt: new Date(cursor.createdAt),
    source: cursor.source,
    id: cursor.id,
  }) > 0;
}

export function cursorForItem(item: {
  createdAt: Date;
  source: MarketplaceSource;
  id: string;
}): MarketplaceCursor {
  return { createdAt: item.createdAt.toISOString(), source: item.source, id: item.id };
}

export function haversineDistanceMeters(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const latDistance = radians(to.lat - from.lat);
  const lonDistance = radians(to.lon - from.lon);
  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lonDistance / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function withinBudget(
  budget: {
    kind: "EXACT" | "RANGE" | "OPEN";
    minAmountMinor: number | null;
    maxAmountMinor: number | null;
    currency: string;
  },
  filter: { currency?: string; minAmountMinor?: number; maxAmountMinor?: number },
) {
  if (filter.currency && budget.currency !== filter.currency) return false;
  if (budget.kind === "OPEN") {
    return filter.minAmountMinor === undefined && filter.maxAmountMinor === undefined;
  }
  const low = budget.minAmountMinor ?? 0;
  const high = budget.maxAmountMinor ?? low;
  if (filter.minAmountMinor !== undefined && high < filter.minAmountMinor) return false;
  if (filter.maxAmountMinor !== undefined && low > filter.maxAmountMinor) return false;
  return true;
}

export function isPublicNeedAt(
  need: { state: string; endsAt: Date; archivedAt: Date | null },
  now: Date,
) {
  return need.state === "OPEN" && need.archivedAt === null && need.endsAt > now;
}
