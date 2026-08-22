import type { AddressLevel } from "@/domain/location/types";
import type { Lang } from "@/domain/lang/types";
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
export function formatJapaneseAddress(r: any, lang: Lang = "ja") {
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
  if (r.type === "station") {
    const stationSuffix =
      lang === "ja" ? "駅" : lang === "zh" ? "站" : " Station";
    const alreadyHasSuffix =
      lang === "en"
        ? /\bstation$/i.test(r.name)
        : r.name.endsWith(stationSuffix);
    main = alreadyHasSuffix ? r.name : `${r.name}${stationSuffix}`;
  }
  else if (isPOI(r)) {
    if (r.name) {
      main = `${r.name}（${subHierarchy.slice(-2).join(" ")}）`;
    } else {
      main =
        normalized.residential ||
        normalized.neighbourhood ||
        normalized.district ||
        (lang === "ja"
          ? "周辺施設"
          : lang === "zh"
            ? "附近设施"
            : "Nearby place");
    }
  } else
    main =
      r.name ||
      normalized.residential ||
      normalized.neighbourhood ||
      normalized.district ||
      normalized.city;

  const sub = subHierarchy.filter((part) => !main.includes(part!)).join(" ");
  const publicRegionParts = [normalized.city, normalized.district]
    .filter((part, index, values): part is string => Boolean(part) && values.indexOf(part) === index);
  const publicRegion = publicRegionParts
    .join(lang === "en" ? ", " : "")
    .replace(lang === "zh" ? /區/g : /$^/, "区");
  return { main, sub, publicRegion };
}
