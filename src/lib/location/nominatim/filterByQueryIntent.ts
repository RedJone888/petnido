export function filterByQueryIntent(results: any[], query: string) {
  if (/駅/.test(query)) {
    return results.filter((r) => r.type === "station" || r.class === "railway");
  }
  if (/(区|市|町|村)/.test(query)) {
    return results.filter(
      (r) => r.type === "administrative" || r.class === "boundary"
    );
  }
  return results;
}
