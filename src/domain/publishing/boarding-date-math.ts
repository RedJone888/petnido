export function boardingNights(dates: {
  startDate: string;
  endDate: string;
}) {
  if (!dates.startDate || !dates.endDate) return 0;
  const start = new Date(`${dates.startDate}T00:00:00`);
  const end = new Date(`${dates.endDate}T00:00:00`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86_400_000);
  if (!Number.isFinite(diff) || diff < 0) return 0;
  return Math.max(1, diff);
}
