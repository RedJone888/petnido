import { describe, expect, it } from "vitest";
import { formatMoneyAmount } from "./presentation";

describe("formatMoneyAmount", () => {
  it("formats zero-decimal currencies (JPY, KRW) without decimals", () => {
    const jpy = formatMoneyAmount(3500, "JPY", "ja");
    expect(jpy).toContain("3,500");
    expect(jpy).toContain("￥");

    const krw = formatMoneyAmount(50000, "KRW", "en");
    expect(krw).toContain("50,000");
  });

  it("formats decimal currencies (USD, CNY, EUR) by dividing minor units by 100", () => {
    const usd = formatMoneyAmount(4500, "USD", "en");
    expect(usd).toContain("45.00");
    expect(usd).toContain("$");

    const cny = formatMoneyAmount(12850, "CNY", "zh");
    expect(cny).toContain("128.50");
    expect(cny).toContain("¥");
  });

  it("handles null, undefined, and NaN gracefully", () => {
    expect(formatMoneyAmount(null, "JPY")).toBe("—");
    expect(formatMoneyAmount(undefined, "USD")).toBe("—");
    expect(formatMoneyAmount(Number.NaN, "CNY")).toBe("—");
  });
});
