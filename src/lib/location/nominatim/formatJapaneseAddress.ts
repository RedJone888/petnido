import type { AddressLevel } from "@/domain/location/types";
import { getLevelMap } from "./getLevelMap";

function isPOI(r: any) {
  return ["shop", "amenity", "tourism"].includes(r.class);
}
function normalizeAddress(address: any) {
  const levelMap = getLevelMap(address.country_code);
  const buckets: Partial<Record<AddressLevel, string>> = {};
  for (const key in address) {
    const level = levelMap[key];
    if (!level) continue;
    if (!buckets[level]) {
      buckets[level] = address[key];
    }
  }
  return buckets;
}
export function formatJapaneseAddress(r: any) {
  const a = r.address ?? {};
  const normalized = normalizeAddress(a);
  const subHierarchy = [
    normalized.country,
    normalized.admin1,
    normalized.city,
    normalized.district,
    normalized.neighbourhood,
    normalized.residential,
  ].filter(Boolean);
  let main = "";
  if (r.type === "station") main = `${r.name}駅`;
  else if (isPOI(r)) {
    if (r.name) {
      main = `${r.name}（${subHierarchy.slice(-2).join(" ")}）`;
    } else {
      main =
        normalized.residential ||
        normalized.neighbourhood ||
        normalized.district ||
        "周辺施設";
    }
  } else
    main =
      r.name ||
      normalized.residential ||
      normalized.neighbourhood ||
      normalized.district ||
      normalized.city;

  const sub = subHierarchy.filter((part) => !main.includes(part!)).join(" ");
  return { main, sub };
}
