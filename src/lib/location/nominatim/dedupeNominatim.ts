import { rankNominatimType } from "./rankNominatimType";

export function dedupeNominatim(results: any[]) {
  if (!results || !results.length) return [];
  const map = new Map<string, any>();
  for (const r of results) {
    const key =
      r.place_id != null
        ? String(r.place_id)
        : r.osm_type && r.osm_id
          ? `${r.osm_type}-${r.osm_id}`
          : r.display_name || r.name || JSON.stringify(r);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, r);
    } else {
      if (rankNominatimType(r) > rankNominatimType(prev)) {
        map.set(key, r);
      }
    }
  }
  return Array.from(map.values());
}
