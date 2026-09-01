type NeedDateRangeInput = {
  source: "V2" | "PREVIEW";
  mode: string;
  startsAt: Date | string;
  endsAt: Date | string;
  timeZone?: string | null;
};

function dateValueInTimeZone(
  value: Date | string,
  timeZone?: string | null,
) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function previousCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Converts published storage instants into the calendar dates selected by the
 * request owner. V2 home-visit and custom needs store an exclusive end instant;
 * boarding records already store the date that should be displayed.
 */
export function needDisplayDateRange(input: NeedDateRangeInput) {
  const startDate = dateValueInTimeZone(input.startsAt, input.timeZone);
  const storedEndDate = dateValueInTimeZone(input.endsAt, input.timeZone);
  const hasExclusiveEnd =
    input.source === "V2" && input.mode !== "BOARDING";

  return {
    startDate,
    endDate: hasExclusiveEnd
      ? previousCalendarDate(storedEndDate)
      : storedEndDate,
  };
}
