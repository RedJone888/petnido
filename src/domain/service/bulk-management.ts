export const serviceBulkCommands = ["PAUSE_ALL", "RESUME_ALL", "SET_LOCATION", "SET_CURRENCY"] as const;
export type ServiceBulkCommand = (typeof serviceBulkCommands)[number];

export function serviceBulkImpact(command: ServiceBulkCommand, counts: { active: number; paused: number; legacy: number }) {
  if (command === "PAUSE_ALL") return { affectedV2: counts.active, affectedLegacy: counts.legacy, profileAccepting: false };
  if (command === "RESUME_ALL") return { affectedV2: counts.paused, affectedLegacy: counts.legacy, profileAccepting: true };
  return { affectedV2: counts.active + counts.paused, affectedLegacy: counts.legacy, profileAccepting: null };
}
