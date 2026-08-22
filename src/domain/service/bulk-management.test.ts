import { describe, expect, it } from "vitest";

import { serviceBulkImpact } from "./bulk-management";

describe("service bulk management impact", () => {
  it("pauses only currently active V2 services while globally stopping legacy exposure", () => {
    expect(serviceBulkImpact("PAUSE_ALL", { active: 3, paused: 2, legacy: 4 })).toEqual({ affectedV2: 3, affectedLegacy: 4, profileAccepting: false });
  });

  it("location and currency intentionally overwrite every non-archived single-service value", () => {
    expect(serviceBulkImpact("SET_LOCATION", { active: 3, paused: 2, legacy: 4 })).toEqual({ affectedV2: 5, affectedLegacy: 4, profileAccepting: null });
  });
});
