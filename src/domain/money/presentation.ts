import type { Lang } from "@/domain/lang/types";

/**
 * Standard money formatter across the entire application.
 * - Handles zero-decimal currencies (e.g. JPY, KRW) vs decimal currencies (e.g. USD, EUR, CNY).
 * - Accepts amounts in minor units (cents/cents-equivalent or whole units for zero-decimal currencies).
 * - Gracefully handles null, undefined, and NaN values.
 */
export function formatMoneyAmount(
  amount: number | null | undefined,
  currency: string,
  lang?: Lang,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  const divisor = currency === "JPY" || currency === "KRW" ? 1 : 100;
  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "en" ? "en-US" : undefined;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: divisor === 1 ? 0 : 2,
  }).format(amount / divisor);
}

export { formatMoneyAmount as formatMoney };
