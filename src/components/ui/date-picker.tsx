"use client";

import { useState, type ReactNode } from "react";
import { calendarLabels } from "@/components/ui/calendar-labels";
import { DayPicker } from "react-day-picker";
import { enUS, ja, zhCN } from "date-fns/locale";
import { PiCalendarBlank, PiCaretLeft, PiCaretRight } from "react-icons/pi";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { useLanguage } from "@/components/providers/language-provider";
import cn from "@/lib/cn";

const calendarLocales = { en: enUS, zh: zhCN, ja } as const;

export type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  maxDate?: Date;
  defaultMonth?: Date;
  placeholder?: ReactNode;
  triggerClassName?: string;
  popoverClassName?: string;
  invalid?: boolean;
  disabled?: boolean;
  showToday?: boolean;
  showClear?: boolean;
  todayLabel?: string;
  clearLabel?: string;
};

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function toDateValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function decadeStart(year: number) {
  return Math.floor(year / 10) * 10;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  defaultMonth,
  placeholder,
  triggerClassName,
  popoverClassName,
  invalid = false,
  disabled = false,
  showToday = true,
  showClear = true,
  todayLabel,
  clearLabel,
}: DatePickerProps) {
  const { lang } = useLanguage();
  const today = startOfDay(new Date());
  const lowerBound = minDate ? startOfDay(minDate) : undefined;
  const upperBound = maxDate ? startOfDay(maxDate) : undefined;
  const selected = parseDateValue(value);
  const initialDate = selected ?? defaultMonth ?? upperBound ?? lowerBound ?? today;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(initialDate));
  const [pickerView, setPickerView] = useState<"days" | "months" | "years">(
    "days",
  );
  const [yearPageStart, setYearPageStart] = useState(() =>
    decadeStart(initialDate.getFullYear()),
  );
  const localeName = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  const monthLabel = new Intl.DateTimeFormat(localeName, {
    month: "long",
  }).format(month);
  const yearLabel = new Intl.DateTimeFormat(localeName, {
    year: "numeric",
  }).format(month);
  const isDisabled = (date: Date) => {
    const candidate = startOfDay(date);
    return Boolean(
      (lowerBound && candidate < lowerBound) ||
        (upperBound && candidate > upperBound),
    );
  };
  const isMonthInRange = (year: number, monthIndex: number) => {
    const candidateStart = new Date(year, monthIndex, 1);
    const candidateEnd = endOfMonth(candidateStart);
    return !(
      (lowerBound && candidateEnd < lowerBound) ||
      (upperBound && candidateStart > upperBound)
    );
  };
  const isYearInRange = (year: number) => {
    const candidateStart = new Date(year, 0, 1);
    const candidateEnd = new Date(year, 11, 31);
    return !(
      (lowerBound && candidateEnd < lowerBound) ||
      (upperBound && candidateStart > upperBound)
    );
  };
  const lowerMonth = lowerBound ? startOfMonth(lowerBound) : undefined;
  const upperMonth = upperBound ? startOfMonth(upperBound) : undefined;
  const canGoToPrevious =
    pickerView === "years"
      ? !lowerBound || yearPageStart >= lowerBound.getFullYear()
      : pickerView === "months"
        ? !lowerBound || month.getFullYear() > lowerBound.getFullYear()
        : !lowerMonth || month > lowerMonth;
  const canGoToNext =
    pickerView === "years"
      ? !upperBound || yearPageStart + 10 <= upperBound.getFullYear()
      : pickerView === "months"
        ? !upperBound || month.getFullYear() < upperBound.getFullYear()
        : !upperMonth || month < upperMonth;
  const monthItems = Array.from({ length: 12 }, (_, index) => ({
    index,
    label: new Intl.DateTimeFormat(localeName, { month: "short" }).format(
      new Date(month.getFullYear(), index, 1),
    ),
    disabled: !isMonthInRange(month.getFullYear(), index),
  }));
  const yearItems = Array.from({ length: 12 }, (_, index) => {
    const year = yearPageStart + index - 1;
    return { year, disabled: !isYearInRange(year) };
  });
  const changeOpen = (next: boolean) => {
    if (next) {
      const nextDate = selected ?? defaultMonth ?? upperBound ?? lowerBound ?? today;
      setMonth(startOfMonth(nextDate));
      setYearPageStart(decadeStart(nextDate.getFullYear()));
      setPickerView("days");
    }
    setOpen(next);
  };
  const chooseDate = (date: Date | undefined) => {
    if (!date || isDisabled(date)) return;
    onChange(toDateValue(date));
    setOpen(false);
    setPickerView("days");
  };
  const previousLabel =
    pickerView === "years"
      ? lang === "zh"
        ? "前十年"
        : lang === "ja"
          ? "前の10年"
          : "Previous 10 years"
      : pickerView === "months"
        ? lang === "zh"
          ? "上一年"
          : lang === "ja"
            ? "前年"
            : "Previous year"
        : lang === "zh"
          ? "上个月"
          : lang === "ja"
            ? "前月"
            : "Previous month";
  const nextLabel =
    pickerView === "years"
      ? lang === "zh"
        ? "后十年"
        : lang === "ja"
          ? "次の10年"
          : "Next 10 years"
      : pickerView === "months"
        ? lang === "zh"
          ? "下一年"
          : lang === "ja"
            ? "翌年"
            : "Next year"
        : lang === "zh"
          ? "下个月"
          : lang === "ja"
            ? "次月"
            : "Next month";
  const resolvedTodayLabel =
    todayLabel ?? (lang === "zh" ? "今天" : lang === "ja" ? "今日" : "Today");
  const resolvedClearLabel =
    clearLabel ?? (lang === "zh" ? "清除" : lang === "ja" ? "クリア" : "Clear");
  const formatted = selected
    ? new Intl.DateTimeFormat(localeName, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(selected)
    : placeholder ?? (lang === "ja" ? "日付を選択" : lang === "zh" ? "选择日期" : "Select date");

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-invalid={invalid || undefined}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60",
            triggerClassName,
          )}
        >
          <span className={selected ? "text-slate-900" : "text-slate-400"}>
            {formatted}
          </span>
          <PiCalendarBlank className="h-5 w-5 shrink-0 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className={cn(
          "z-[1200] w-[calc(100vw-24px)] max-h-[min(420px,calc(100dvh-128px))] max-w-[calc(100vw-24px)] overflow-y-auto border-[#ded9e0] p-2 [--rdp-accent-color:var(--primary)] [--rdp-accent-background-color:#f1edf5] md:w-[var(--radix-popover-trigger-width)] md:max-w-[calc(100vw-24px)]",
          popoverClassName,
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            aria-label={previousLabel}
            disabled={!canGoToPrevious}
            onClick={() => {
              if (pickerView === "years") {
                setYearPageStart((current) => current - 10);
              } else if (pickerView === "months") {
                setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
              } else {
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
              }
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[#f1edf5] disabled:pointer-events-none disabled:opacity-30"
          >
            <PiCaretLeft size={22} />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
            {pickerView === "years" ? (
              <span className="text-sm font-bold text-[#514956]">
                {yearPageStart}–{yearPageStart + 9}
              </span>
            ) : pickerView === "months" ? (
              <button
                type="button"
                onClick={() => {
                  setYearPageStart(decadeStart(month.getFullYear()));
                  setPickerView("years");
                }}
                className="rounded-lg px-2 py-1 text-sm font-bold text-[#514956] transition hover:bg-[#f1edf5]"
              >
                {yearLabel}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPickerView("months")}
                  className="rounded-lg px-2 py-1 text-sm font-bold text-[#514956] transition hover:bg-[#f1edf5]"
                >
                  {monthLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearPageStart(decadeStart(month.getFullYear()));
                    setPickerView("years");
                  }}
                  className="rounded-lg px-2 py-1 text-sm font-bold text-[#514956] transition hover:bg-[#f1edf5]"
                >
                  {yearLabel}
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            aria-label={nextLabel}
            disabled={!canGoToNext}
            onClick={() => {
              if (pickerView === "years") {
                setYearPageStart((current) => current + 10);
              } else if (pickerView === "months") {
                setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
              } else {
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
              }
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[#f1edf5] disabled:pointer-events-none disabled:opacity-30"
          >
            <PiCaretRight size={22} />
          </button>
        </div>
        {pickerView === "years" ? (
          <div className="grid grid-cols-3 gap-1 py-2">
            {yearItems.map((item) => (
              <button
                key={item.year}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setMonth(new Date(item.year, month.getMonth(), 1));
                  setYearPageStart(decadeStart(item.year));
                  setPickerView("months");
                }}
                className={cn(
                  "h-10 rounded-xl text-xs transition hover:bg-[#f1edf5]",
                  item.year === month.getFullYear() &&
                    "bg-[#f1edf5] font-bold text-[var(--primary)]",
                  item.disabled &&
                    "cursor-not-allowed text-[#c8c3c9] hover:bg-transparent",
                )}
              >
                {item.year}
              </button>
            ))}
          </div>
        ) : pickerView === "months" ? (
          <div className="grid grid-cols-3 gap-1 py-2">
            {monthItems.map((item) => (
              <button
                key={item.index}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  setMonth(new Date(month.getFullYear(), item.index, 1));
                  setPickerView("days");
                }}
                className={cn(
                  "h-10 rounded-xl px-2 text-xs transition hover:bg-[#f1edf5]",
                  item.index === month.getMonth() &&
                    "bg-[#f1edf5] font-bold text-[var(--primary)]",
                  item.disabled &&
                    "cursor-not-allowed text-[#c8c3c9] hover:bg-transparent",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <DayPicker
          labels={calendarLabels(lang)}
            mode="single"
            month={month}
            onMonthChange={setMonth}
            hideNavigation
            locale={calendarLocales[lang]}
            startMonth={lowerMonth}
            endMonth={upperMonth}
            selected={selected}
            disabled={isDisabled}
            onSelect={chooseDate}
            components={{
              DayButton: ({ day, modifiers, className, ...props }) => (
                <button
                  {...props}
                  className={cn(
                    className,
                    "mx-auto h-7 w-7 rounded-full text-xs transition",
                    modifiers.disabled || modifiers.outside
                      ? "text-[#c8c3c9]"
                      : "text-[#514956] hover:bg-[#f1edf5]",
                    modifiers.selected &&
                      "border-2 border-[var(--primary)] bg-[#f1edf5] font-bold text-[var(--primary)] hover:bg-[#e9dff0]",
                  )}
                />
              ),
            }}
            classNames={{
              root: "date-picker-calendar w-full px-1",
              months: "w-full",
              month: "w-full",
              month_grid: "w-full table-fixed",
              day: "p-0",
              day_button: "mx-auto",
              weekday: "text-xs",
              month_caption: "hidden",
              caption_label: "sr-only",
              button_previous: "h-8 w-8",
              button_next: "h-8 w-8",
            }}
          />
        )}
        {showToday || showClear ? (
          <div className="flex items-center justify-between border-t border-[#eee9ef] pt-2">
            {showToday ? (
              <button
                type="button"
                onClick={() => chooseDate(today)}
                disabled={isDisabled(today)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[#f1edf5] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {resolvedTodayLabel}
              </button>
            ) : (
              <span />
            )}
            {showClear ? (
              <button
                type="button"
                disabled={!value}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[#f1edf5] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {resolvedClearLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
