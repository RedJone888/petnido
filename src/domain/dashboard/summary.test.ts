import { describe, expect, it } from "vitest";

import { summarizeOwnedRecords } from "./summary";

describe("dashboard owned-content summary", () => {
  it("returns stable zero-valued groups for a new or single-role user", () => {
    expect(summarizeOwnedRecords([])).toEqual({
      totals: { needs: 0, services: 0 },
      byMode: { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 },
      needByMode: { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 },
      serviceByMode: { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 },
      needStates: { OPEN: 0, MATCHED: 0, CLOSED: 0 },
      serviceStates: { ACTIVE: 0, PAUSED: 0, ARCHIVED: 0 },
    });
  });

  it("combines legacy-normalized and V2 records without confusing need and service states", () => {
    const result = summarizeOwnedRecords([
      { kind: "NEED", mode: "HOME_VISIT", state: "OPEN" },
      { kind: "NEED", mode: "BOARDING", state: "MATCHED" },
      { kind: "SERVICE", mode: "HOME_VISIT", state: "ACTIVE" },
      { kind: "SERVICE", mode: "CUSTOM", state: "PAUSED" },
    ]);
    expect(result.totals).toEqual({ needs: 2, services: 2 });
    expect(result.byMode).toEqual({ HOME_VISIT: 2, BOARDING: 1, CUSTOM: 1 });
    expect(result.needByMode).toEqual({ HOME_VISIT: 1, BOARDING: 1, CUSTOM: 0 });
    expect(result.serviceByMode).toEqual({ HOME_VISIT: 1, BOARDING: 0, CUSTOM: 1 });
    expect(result.needStates).toMatchObject({ OPEN: 1, MATCHED: 1 });
    expect(result.serviceStates).toMatchObject({ ACTIVE: 1, PAUSED: 1 });
  });
});
