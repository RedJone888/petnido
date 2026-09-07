import { describe, expect, it } from "vitest";
import { formatDateSpan, formatPublishedAt, parseDateValue } from "./presentation";

describe("date presentation", () => {
  it("parseDateValue handles Date, string, and invalid inputs", () => {
    const now = new Date("2026-08-27T00:00:00Z");
    expect(parseDateValue(now)).toEqual(now);
    expect(parseDateValue("2026-08-27")?.getFullYear()).toBe(2026);
    expect(parseDateValue(null)).toBeNull();
    expect(parseDateValue("invalid-date")).toBeNull();
  });

  it("formatDateSpan formats localized spans correctly", () => {
    const start = "2026-08-01";
    const end = "2026-08-05";

    const zh = formatDateSpan(start, end, "zh");
    expect(zh).toContain("8月1日");
    expect(zh).toContain("8月5日");

    const en = formatDateSpan(start, end, "en");
    expect(en).toContain("Aug 1");
    expect(en).toContain("Aug 5, 2026");

    const ja = formatDateSpan(start, end, "ja");
    expect(ja).toContain("8月1日");
    expect(ja).toContain("8月5日");
  });

  it("formatPublishedAt formats single localized date", () => {
    const d = "2026-08-27";
    const zh = formatPublishedAt(d, "zh");
    expect(zh).toContain("2026");
    expect(zh).toContain("8月27日");

    const en = formatPublishedAt(d, "en");
    expect(en).toContain("Aug 27, 2026");
  });
});

it("shows both years in a cross-year request", () => {
  for (const lang of ["en", "ja", "zh"] as const) {
    const result = formatDateSpan("2026-12-30", "2027-01-03", lang);
    expect(result).toContain("2026");
    expect(result).toContain("2027");
  }
});
