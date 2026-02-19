import { AvailabilityRangeType, AvailabilityWeekPattern } from "@prisma/client";
import {
  AVAILABILITY_RANGE_TYPE_JA,
  AVAILABILITY_WEEK_PATTERN_JA,
} from "./constant";
import { format } from "date-fns";

export function formatAvailabilityText({
  rangeType,
  from,
  to,
  weekPattern,
  includeHolidays,
}: {
  rangeType: AvailabilityRangeType;
  from?: string | null;
  to?: string | null;
  weekPattern: AvailabilityWeekPattern;
  includeHolidays: boolean;
}) {
  const fromLabel = `${from ? format(from, "MM月dd日") : ""}`;
  const toLabel = `${to ? format(to, "MM月dd日") : ""}`;
  const range =
    rangeType === AvailabilityRangeType.DATE_RANGE
      ? `${fromLabel}〜${toLabel}`
      : AVAILABILITY_RANGE_TYPE_JA[rangeType].label;

  const conditions = [
    AVAILABILITY_WEEK_PATTERN_JA[weekPattern].label,
    includeHolidays && "祝日対応",
  ]
    .filter(Boolean)
    .join(" • ");
  return {
    range,
    conditions,
  };
}
