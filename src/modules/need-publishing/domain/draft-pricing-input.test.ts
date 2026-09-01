import { describe, expect, it } from "vitest";

import { visitIntervalDays } from "./draft-pricing-input";

describe("visitIntervalDays", () => {
  it("ignores the hidden custom interval for preset frequencies", () => {
    expect(visitIntervalDays("every-day", 4)).toBe(1);
    expect(visitIntervalDays("every-2-days", 4)).toBe(2);
    expect(visitIntervalDays("every-3-days", 4)).toBe(3);
  });

  it("uses the custom interval only when custom frequency is selected", () => {
    expect(visitIntervalDays("custom", 4)).toBe(4);
    expect(visitIntervalDays("custom", 0)).toBe(1);
  });
});
