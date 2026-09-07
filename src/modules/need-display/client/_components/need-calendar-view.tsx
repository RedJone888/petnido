"use client";

import { useEffect, useState } from "react";
import { enUS, ja, zhCN } from "date-fns/locale";
import { calendarLabels } from "@/components/ui/calendar-labels";
import { DayPicker } from "react-day-picker";
import { PiCaretLeft, PiCaretRight, PiClock } from "react-icons/pi";

import type { Lang } from "@/domain/lang/types";
import type { RouterOutputs } from "@/server/trpc";
import { messages } from "@/i18n/messages";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";
import { getNeedDisplayMessages } from "@/modules/need-display/i18n/messages";
import { parseDateValue } from "@/domain/marketplace/need-pricing";
import cn from "@/lib/cn";
import { needDisplayDateRange } from "@/domain/marketplace/need-date-range";
import {
  buildVisitScheduleDates,
  customTimeLabel,
  startOfMonth,
  toDateValue,
} from "../_utils/presentation-formatters";

type NeedDetailDTO = RouterOutputs["marketplaceNeed"]["get"];

export function NeedCalendarView({
  item,
  lang,
}: {
  item: NeedDetailDTO;
  lang: Lang;
}) {
  const displayDates = needDisplayDateRange(item);
  const startDate = parseDateValue(displayDates.startDate);
  const endDate = parseDateValue(displayDates.endDate);
  const needCopy = getNeedPublishingMessages(lang);
  const displayCopy = getNeedDisplayMessages(lang);
  const startMonth = startDate ? startOfMonth(startDate) : undefined;
  const endMonth = endDate ? startOfMonth(endDate) : undefined;

  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(startDate ?? new Date())
  );

  useEffect(() => {
    const nextStartDate = parseDateValue(displayDates.startDate);
    if (nextStartDate) setCalendarMonth(startOfMonth(nextStartDate));
  }, [displayDates.startDate]);

  const isSingleMonth = Boolean(
    startMonth && endMonth && startMonth.getTime() === endMonth.getTime()
  );
  const canGoPrevious = Boolean(startMonth && calendarMonth > startMonth);
  const canGoNext = Boolean(endMonth && calendarMonth < endMonth);

  const changeMonth = (offset: number) => {
    const next = startOfMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1)
    );
    if (startMonth && next < startMonth) return setCalendarMonth(startMonth);
    if (endMonth && next > endMonth) return setCalendarMonth(endMonth);
    setCalendarMonth(next);
  };

  const t = messages[lang] ?? messages.en;
  const monthFormatted = calendarMonth.toLocaleDateString(
    lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const MonthNavHeader = (
    <div className="mb-0.5 flex min-h-7 items-center justify-between pb-1">
      {isSingleMonth ? (
        <span className="h-7 w-7" aria-hidden="true" />
      ) : (
        <button
          type="button"
          aria-label={lang === "ja" ? "前の月" : lang === "zh" ? "上个月" : "Previous month"}
          disabled={!canGoPrevious}
          onClick={() => changeMonth(-1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#514956] transition hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-25"
        >
          <PiCaretLeft size={18} />
        </button>
      )}
      <p className="text-xs sm:text-sm font-bold text-[#514956]">{monthFormatted}</p>
      {isSingleMonth ? (
        <span className="h-7 w-7" aria-hidden="true" />
      ) : (
        <button
          type="button"
          aria-label={lang === "ja" ? "次の月" : lang === "zh" ? "下个月" : "Next month"}
          disabled={!canGoNext}
          onClick={() => changeMonth(1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#514956] transition hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-25"
        >
          <PiCaretRight size={18} />
        </button>
      )}
    </div>
  );

  // 1. BOARDING (家庭寄养: 连续住宿范围高亮)
  if (item.mode === "BOARDING") {
    return (
      <div className="w-full">
        {MonthNavHeader}
        <DayPicker
          labels={calendarLabels(lang)}
          locale={{ en: enUS, ja, zh: zhCN }[lang]}
          key={`boarding-${item.startsAt}:${item.endsAt}`}
          mode="range"
          month={calendarMonth}
          selected={startDate && endDate ? { from: startDate, to: endDate } : undefined}
          showOutsideDays
          hideNavigation
          components={{
            DayButton: ({ day, modifiers, className, ...props }) => {
              const isStart = modifiers.range_start;
              const isEnd = modifiers.range_end;
              const isMiddle = modifiers.range_middle;
              const inRange = isStart || isMiddle || isEnd;
              return (
                <button
                  {...props}
                  tabIndex={-1}
                  className={cn(
                    className,
                    "pointer-events-none relative mx-0 h-6 w-full rounded-none text-[11px]",
                    modifiers.outside ? "text-[#c8c3c9]" : "text-[#514956]"
                  )}
                >
                  {inRange && !(isStart && isEnd) ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-1",
                        modifiers.outside ? "bg-[#f3edf6]" : "bg-[#e8d9f0]",
                        isStart && "left-1/2 right-0 rounded-l-full",
                        isMiddle && "left-0 right-0",
                        isEnd && "left-0 right-1/2 rounded-r-full"
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mx-auto grid h-6 w-6 place-items-center rounded-full",
                      (isStart || isEnd) && !modifiers.outside && "bg-[var(--primary)] font-extrabold text-white shadow-sm",
                      (isStart || isEnd) && modifiers.outside && "bg-[#cbbbd4] font-extrabold text-white",
                      isMiddle && !modifiers.outside && "font-bold text-[#5d3a70]",
                      isMiddle && modifiers.outside && "font-bold text-[#b4a5bb]"
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                </button>
              );
            },
          }}
          classNames={{
            root: "w-full overflow-hidden pb-0",
            months: "w-full",
            month: "w-full",
            month_grid: "w-full table-fixed",
            day: "h-8 p-0 text-center",
            day_button: "w-full",
            weekday: "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
            month_caption: "hidden",
          }}
        />
        <div className="mt-1 flex items-center gap-2 px-2 text-[11px] font-semibold text-[#817a85]">
          <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
          <span>{displayCopy.boardingPeriod}</span>
        </div>
      </div>
    );
  }

  // 2. HOME_VISIT (上门照护: 计划上门排班点位)
  if (item.mode === "HOME_VISIT") {
    const customInterval = item.schedule?.homeVisit?.intervalDays || 1;
    const plannedDates = buildVisitScheduleDates(displayDates.startDate, displayDates.endDate, "custom", customInterval);
    const candidateDateSet = new Set(plannedDates);

    return (
      <div className="w-full">
        {MonthNavHeader}
        <DayPicker
          labels={calendarLabels(lang)}
          locale={{ en: enUS, ja, zh: zhCN }[lang]}
          key={`visit-${item.startsAt}:${item.endsAt}`}
          mode="single"
          month={calendarMonth}
          showOutsideDays
          startMonth={startMonth}
          endMonth={endMonth}
          hideNavigation
          disabled={startDate && endDate ? [{ before: startDate }, { after: endDate }] : () => true}
          components={{
            DayButton: ({ day, modifiers, className, ...props }) => {
              const dateStr = toDateValue(day.date);
              const isPlanned = candidateDateSet.has(dateStr);
              const isInRequestRange = Boolean(startDate && endDate && day.date >= startDate && day.date <= endDate);
              return (
                <button
                  {...props}
                  tabIndex={-1}
                  className={cn(
                    className,
                    "pointer-events-none h-6 w-6 rounded-full text-[11px] transition",
                    !isPlanned && (modifiers.disabled || modifiers.outside ? "text-[#c8c3c9]" : "text-[#514956]"),
                    isInRequestRange && !isPlanned && !modifiers.outside && "font-bold text-[#3f3945]",
                    isPlanned && !modifiers.outside && "h-[26px] w-[26px] border-2 border-[var(--primary)] bg-white font-extrabold text-[var(--primary)]",
                    isPlanned && modifiers.outside && "h-[26px] w-[26px] border-2 border-[#d4c7dc] bg-[#faf8fb] font-extrabold text-[#b09bb9]"
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            },
          }}
          classNames={{
            root: "w-full overflow-hidden pb-0",
            months: "w-full",
            month: "w-full",
            month_grid: "w-full table-fixed",
            day: "h-8 p-0 text-center",
            day_button: "mx-auto",
            weekday: "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
            month_caption: "hidden",
          }}
        />
        <div className="mt-1 flex items-center gap-2 px-2 text-[11px] font-semibold text-[#817a85]">
          <span className="h-3 w-3 rounded-full border-2 border-[var(--primary)] bg-white" />
          <span>{displayCopy.careDates}</span>
        </div>
      </div>
    );
  }

  // 3. CUSTOM (自定义与灵活照护)
  const customSchedule =
    "custom" in item.schedule ? item.schedule.custom : null;
  const timePreferenceLabel =
    customSchedule?.timePreference
      ? customTimeLabel(
          customSchedule.timePreference,
          customSchedule.exactTime,
          t,
          needCopy,
        )
      : needCopy.needPublishing.timeOptions.flexible;

  return (
    <div className="w-full">
      {MonthNavHeader}
      <DayPicker
          labels={calendarLabels(lang)}
          locale={{ en: enUS, ja, zh: zhCN }[lang]}
        key={`custom-${item.startsAt}:${item.endsAt}`}
        mode="range"
        month={calendarMonth}
        selected={startDate && endDate ? { from: startDate, to: endDate } : undefined}
        showOutsideDays
        hideNavigation
        components={{
          DayButton: ({ day, modifiers, className, ...props }) => {
            const isStart = modifiers.range_start;
            const isEnd = modifiers.range_end;
            const isMiddle = modifiers.range_middle;
            const inRange = isStart || isMiddle || isEnd;
            return (
              <button
                {...props}
                tabIndex={-1}
                className={cn(
                  className,
                  "pointer-events-none relative mx-0 h-6 w-full rounded-none text-[11px]",
                  modifiers.outside ? "text-[#c8c3c9]" : "text-[#514956]"
                )}
              >
                {inRange && !(isStart && isEnd) ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-1",
                      modifiers.outside ? "bg-[#f3edf6]" : "bg-[#ede7f5]",
                      isStart && "left-1/2 right-0 rounded-l-full",
                      isMiddle && "left-0 right-0",
                      isEnd && "left-0 right-1/2 rounded-r-full"
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 mx-auto grid h-6 w-6 place-items-center rounded-full",
                    (isStart || isEnd) && !modifiers.outside && "bg-[var(--primary)] font-extrabold text-white shadow-sm",
                    (isStart || isEnd) && modifiers.outside && "bg-[#cbbbd4] font-extrabold text-white",
                    isMiddle && !modifiers.outside && "font-bold text-[#5d3a70]",
                    isMiddle && modifiers.outside && "font-bold text-[#b4a5bb]"
                  )}
                >
                  {day.date.getDate()}
                </span>
              </button>
            );
          },
        }}
        classNames={{
          root: "w-full overflow-hidden pb-0",
          months: "w-full",
          month: "w-full",
          month_grid: "w-full table-fixed",
          day: "h-8 p-0 text-center",
          day_button: "w-full",
          weekday: "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
          month_caption: "hidden",
        }}
      />
      <div className="mt-1 flex items-center justify-between px-2 text-[11px] text-[#817a85]">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
          <span>{displayCopy.serviceWindow}</span>
        </span>
        <span className="font-bold text-[#2B231D] flex items-center gap-1">
          <PiClock size={13} className="text-primary shrink-0" />
          <span>{timePreferenceLabel}</span>
        </span>
      </div>
    </div>
  );
}
export default NeedCalendarView;
