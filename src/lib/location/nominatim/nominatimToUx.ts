import type { Lang } from "@/domain/lang/types";
import { dedupeNominatim } from "./dedupeNominatim";
import { filterByQueryIntent } from "./filterByQueryIntent";
import { formatJapaneseAddress } from "./formatJapaneseAddress";
import { rankNominatimType } from "./rankNominatimType";

export function nominatimToUx(
  rawResults: any[],
  query: string,
  lang: Lang = "ja",
) {
  if (!rawResults || !rawResults.length) return [];
  let results = dedupeNominatim(rawResults);
  if (query) {
    results = filterByQueryIntent(results, query);
  }
  if (results.length > 1) {
    results = results.sort(
      (a, b) => rankNominatimType(b) - rankNominatimType(a)
    );
  }
  const formatted = results.map((r) => {
    const { main, sub, publicRegion } = formatJapaneseAddress(r, lang);
    return {
      id: `${r.osm_type}-${r.osm_id}`,
      countryCode: r.address?.country_code ? r.address.country_code.toUpperCase() : "",
      label: main,
      subLabel: sub,
      regionLabel: publicRegion || main || null,
      lat: Number(r.lat),
      lon: Number(r.lon),
      type: r.type,
      raw: r,
    };
  });

  const seen = new Set<string>();
  return formatted.filter((item) => {
    const key = `${item.label}::${item.subLabel ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
