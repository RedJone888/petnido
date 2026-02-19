import { dedupeNominatim } from "./dedupeNominatim";
import { filterByQueryIntent } from "./filterByQueryIntent";
import { formatJapaneseAddress } from "./formatJapaneseAddress";
import { rankNominatimType } from "./rankNominatimType";

export function nominatimToUx(rawResults: any[], query: string) {
  if (!rawResults.length) return [];
  let results = dedupeNominatim(rawResults);
  if (query) {
    results = filterByQueryIntent(results, query);
  }
  if (results.length > 1) {
    results = results.sort(
      (a, b) => rankNominatimType(b) - rankNominatimType(a)
    );
  }
  return results.map((r) => {
    const { main, sub } = formatJapaneseAddress(r);
    return {
      id: `${r.osm_type}-${r.osm_id}`,
      countryCode: r.address.country_code.toUpperCase(),
      label: main,
      subLabel: sub,
      lat: Number(r.lat),
      lon: Number(r.lon),
      type: r.type,
      raw: r,
    };
  });
}
