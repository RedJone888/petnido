import type { Lang } from "@/domain/lang/types";

/**
 * Safely parses Date or ISO date string.
 */
export function parseDateValue(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formats date span (start to end date) with localized representation across EN, ZH, JA.
 */
export function formatDateSpan(
  startsAt: Date | string,
  endsAt: Date | string,
  lang: Lang = "en",
): string {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end) return "";

  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  const startStr = start.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr}–${endStr}`;
}

/**
 * Formats a published timestamp or single date into localized human-readable format.
 */
export function formatPublishedAt(
  date: Date | string | null | undefined,
  lang: Lang = "en",
): string {
  if (!date) return "";
  const d = parseDateValue(date);
  if (!d) return "";
  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
