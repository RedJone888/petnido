export type DashboardOwnedRecord = {
  kind: "NEED" | "SERVICE";
  mode: "HOME_VISIT" | "BOARDING" | "CUSTOM";
  state: string;
};

export function summarizeOwnedRecords(records: DashboardOwnedRecord[]) {
  const byMode = { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 };
  const needByMode = { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 };
  const serviceByMode = { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 };
  const needStates = { OPEN: 0, MATCHED: 0, CLOSED: 0, CANCELLED: 0 };
  const serviceStates = { ACTIVE: 0, PAUSED: 0, ARCHIVED: 0 };
  let needs = 0;
  let services = 0;
  for (const record of records) {
    byMode[record.mode] += 1;
    if (record.kind === "NEED") {
      needs += 1;
      needByMode[record.mode] += 1;
      if (record.state in needStates) needStates[record.state as keyof typeof needStates] += 1;
    } else {
      services += 1;
      serviceByMode[record.mode] += 1;
      if (record.state in serviceStates) serviceStates[record.state as keyof typeof serviceStates] += 1;
    }
  }
  return { totals: { needs, services }, byMode, needByMode, serviceByMode, needStates, serviceStates };
}
