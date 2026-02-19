import { rankNominatimType } from "./rankNominatimType";

export function dedupeNominatim(results: any[]) {
  if (!results) return [];
  const map = new Map<string, any>();
  for (const r of results) {
    const key = r.label;
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
