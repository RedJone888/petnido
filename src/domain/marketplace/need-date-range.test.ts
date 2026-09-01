import { describe, expect, it } from "vitest";

import { needDisplayDateRange } from "./need-date-range";

describe("needDisplayDateRange", () => {
  it("restores the inclusive end date for a V2 home-visit range", () => {
    expect(
      needDisplayDateRange({
        source: "V2",
        mode: "HOME_VISIT",
        startsAt: "2026-09-30T15:00:00.000Z",
        endsAt: "2026-10-31T15:00:00.000Z",
        timeZone: "Asia/Tokyo",
      }),
    ).toEqual({ startDate: "2026-10-01", endDate: "2026-10-31" });
  });

  it("uses calendar arithmetic across a daylight-saving transition", () => {
    expect(
      needDisplayDateRange({
        source: "V2",
        mode: "CUSTOM",
        startsAt: "2026-03-01T08:00:00.000Z",
        endsAt: "2026-03-10T07:00:00.000Z",
        timeZone: "America/Los_Angeles",
      }),
    ).toEqual({ startDate: "2026-03-01", endDate: "2026-03-09" });
  });

  it("does not shift boarding checkout", () => {
    expect(
      needDisplayDateRange({
        source: "V2",
        mode: "BOARDING",
        startsAt: "2026-09-30T15:00:00.000Z",
        endsAt: "2026-10-30T15:00:00.000Z",
        timeZone: "Asia/Tokyo",
      }).endDate,
    ).toBe("2026-10-31");
  });

  it("keeps unpublished preview dates inclusive", () => {
    expect(
      needDisplayDateRange({
        source: "PREVIEW",
        mode: "CUSTOM",
        startsAt: "2026-12-05",
        endsAt: "2026-12-06",
        timeZone: "Asia/Tokyo",
      }),
    ).toEqual({ startDate: "2026-12-05", endDate: "2026-12-06" });
  });
});
