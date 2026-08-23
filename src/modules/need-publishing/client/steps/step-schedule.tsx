"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import {
  PiCalendarBlank,
  PiCaretLeft,
  PiCaretRight,
  PiWarningCircle,
} from "react-icons/pi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { DatePicker } from "@/components/ui/date-picker";
import { boardingNights } from "@/domain/publishing/boarding-date-math";
import type { CareType } from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import {
  buildVisitDateCandidates,
  buildVisitDates,
  Field,
  formatDate,
  inputClass,
  parseDateValue,
  startOfMonth,
  textareaClass,
  timeOptions,
  toDateValue,
} from "../guided-need-flow-shared";
import {
  VisitSelect,
  type VisitSelectOption,
} from "../components/controls/visit-task-combobox";

export function DatesScreen({
  careType,
  value,
  onChange,
  showValidation,
  includeNotes = true,
}: {
  careType: CareType;
  value: { startDate: string; endDate: string; notes: string };
  onChange: (value: {
    startDate: string;
    endDate: string;
    notes: string;
  }) => void;
  showValidation: boolean;
  includeNotes?: boolean;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const form = needMessages.needPublishing.dateForm;
  const startInvalid = showValidation && !value.startDate;
  const endInvalid = showValidation && !value.endDate;
  const copy = {
    visit: {
      start: form.visitStart,
      end: form.visitEnd,
      endHint: form.visitHint,
      notes: form.notes,
      placeholder: form.visitPlaceholder,
    },
    boarding: {
      start: form.boardingStart,
      end: form.boardingEnd,
      endHint: null,
      notes: form.notes,
      placeholder: form.boardingPlaceholder,
    },
    custom: {
      start: form.customEarliest,
      end: form.customLatest,
      endHint: form.customHint,
      notes: form.notes,
      placeholder: form.customPlaceholder,
    },
  }[careType];
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {copy.endHint ? (
          <p className="text-xs font-medium leading-5 text-[#9a939f]">
            {copy.endHint}
          </p>
        ) : null}
        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="min-w-0">
            <LinkedDateField
              label={copy.start}
              value={value.startDate}
              linkedDate={value.endDate}
              invalid={startInvalid}
              error={startInvalid ? form.startError : ""}
              onChange={(startDate) =>
                onChange({
                  ...value,
                  startDate,
                  endDate:
                    value.endDate && startDate && startDate > value.endDate
                      ? ""
                      : value.endDate,
                })
              }
            />
          </div>
          <div className="min-w-0">
            <LinkedDateField
              label={copy.end}
              value={value.endDate}
              linkedDate={value.startDate}
              invalid={endInvalid}
              error={endInvalid ? form.endError : ""}
              onChange={(endDate) =>
                onChange({
                  ...value,
                  startDate:
                    value.startDate && endDate && endDate < value.startDate
                      ? ""
                      : value.startDate,
                  endDate,
                })
              }
            />
          </div>
        </div>
      </div>
      {includeNotes && (
        <Field label={copy.notes} optional>
          <textarea
            value={value.notes}
            onChange={(event) =>
              onChange({ ...value, notes: event.target.value })
            }
            className={textareaClass}
            placeholder={copy.placeholder}
          />
        </Field>
      )}
    </div>
  );
}

export function BoardingDatesScreen({
  dates,
  onDatesChange,
  showValidation,
}: {
  dates: { startDate: string; endDate: string; notes: string };
  onDatesChange: (value: Partial<{
    startDate: string;
    endDate: string;
    notes: string;
  }>) => void;
  showValidation: boolean;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const form = needMessages.needPublishing.dateForm;
  const hasDateRange = Boolean(
    dates.startDate && dates.endDate && dates.startDate <= dates.endDate,
  );
  return (
    <div
      className={cn(
        "grid items-start gap-5",
        "lg:grid-cols-[minmax(0,1fr)_max-content]",
      )}
    >
      <div className="min-w-0">
        <DatesScreen
          careType="boarding"
          value={dates}
          onChange={onDatesChange}
          showValidation={showValidation}
          includeNotes={false}
        />
        <div className="mt-5">
          <Field label={form.notes} optional>
            <textarea
              value={dates.notes}
              onChange={(event) =>
                onDatesChange({ ...dates, notes: event.target.value })
              }
              className={textareaClass}
              placeholder={form.boardingPlaceholder}
            />
          </Field>
        </div>
      </div>
      <div
        className={cn(
          "lg:self-end",
          !hasDateRange && "hidden lg:block lg:invisible",
        )}
        aria-hidden={!hasDateRange}
      >
        <BoardingStayPlan dates={dates} />
      </div>
    </div>
  );
}

export function VisitDatesScreen({
  dates,
  onDatesChange,
  showValidation,
  visitFrequency,
  onVisitFrequencyChange,
  customInterval,
  onCustomIntervalChange,
  visitsPerDay,
  onVisitCountChange,
  visitTimes,
  exactTimes,
  onVisitTimesChange,
  onExactTimesChange,
}: {
  dates: { startDate: string; endDate: string; notes: string };
  onDatesChange: (value: {
    startDate: string;
    endDate: string;
    notes: string;
  }) => void;
  showValidation: boolean;
  visitFrequency: string;
  onVisitFrequencyChange: (value: string) => void;
  customInterval: number;
  onCustomIntervalChange: (value: number) => void;
  visitsPerDay: number;
  onVisitCountChange: (value: number) => void;
  visitTimes: string[];
  exactTimes: string[];
  onVisitTimesChange: (value: string[]) => void;
  onExactTimesChange: (value: string[]) => void;
}) {
  const hasDateRange = Boolean(
    dates.startDate && dates.endDate && dates.startDate <= dates.endDate,
  );
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const form = needMessages.needPublishing.dateForm;
  return (
    <div className="space-y-5">
      <div
        className={cn(
          "grid items-start gap-5",
          "lg:grid-cols-[minmax(0,1fr)_max-content]",
        )}
      >
        <div className="min-w-0">
          <DatesScreen
            careType="visit"
            value={dates}
            onChange={onDatesChange}
            showValidation={showValidation}
            includeNotes={false}
          />
          <div className="mt-5">
            <VisitScheduleScreen
              value={visitFrequency}
              onChange={onVisitFrequencyChange}
              customInterval={customInterval}
              onCustomIntervalChange={onCustomIntervalChange}
              showValidation={showValidation}
              visitsPerDay={visitsPerDay}
              onVisitCountChange={onVisitCountChange}
              visitTimes={visitTimes}
              exactTimes={exactTimes}
              onVisitTimesChange={onVisitTimesChange}
              onExactTimesChange={onExactTimesChange}
            />
          </div>
          <div className="mt-5">
            <Field label={form.notes} optional>
              <textarea
                value={dates.notes}
                onChange={(event) =>
                  onDatesChange({ ...dates, notes: event.target.value })
                }
                className={textareaClass}
                placeholder={form.visitPlaceholder}
              />
            </Field>
          </div>
        </div>
        <div
          className={cn(
            "lg:self-end",
            !hasDateRange && "hidden lg:block lg:invisible",
          )}
          aria-hidden={!hasDateRange}
        >
          <VisitDatePlan
            dates={dates}
            visitFrequency={visitFrequency}
            customInterval={customInterval}
            visitsPerDay={visitsPerDay}
            showValidation={showValidation}
          />
        </div>
      </div>
    </div>
  );
}

export function CustomDatesScreen({
  dates,
  onDatesChange,
  showValidation,
}: {
  dates: {
    startDate: string;
    endDate: string;
    notes: string;
    timeOfDay?: string;
    exactTime?: string;
  };
  onDatesChange: (value: Partial<{
    startDate: string;
    endDate: string;
    notes: string;
    timeOfDay?: string;
    exactTime?: string;
  }>) => void;
  showValidation: boolean;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const form = needMessages.needPublishing.dateForm;
  const timeLabels = needMessages.needPublishing.timeOptions;
  const timeOfDay = dates.timeOfDay ?? "flexible";
  const startInvalid = showValidation && !dates.startDate;
  const endInvalid = showValidation && !dates.endDate;
  const exactInvalid =
    showValidation && timeOfDay === "exact" && !dates.exactTime;
  const timeOptionsWithLabels = timeOptions.map((option) => ({
    value: option.value,
    label: timeLabels[option.value as keyof typeof timeLabels],
  }));
  return (
    <div
      className={cn(
        "grid items-start gap-5",
        "lg:grid-cols-[minmax(0,1fr)_max-content]",
      )}
    >
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-medium leading-5 text-[#9a939f]">
            {form.customHint}
          </p>
          <div className="relative grid grid-cols-2 gap-3 sm:max-w-2xl sm:gap-4">
            <div className="min-w-0">
              <LinkedDateField
                label={form.customEarliest}
                value={dates.startDate}
                linkedDate={dates.endDate}
                invalid={startInvalid}
                error={startInvalid ? form.startError : ""}
                onChange={(startDate) =>
                  onDatesChange({
                    ...dates,
                    startDate,
                    endDate:
                      dates.endDate && startDate && startDate > dates.endDate
                        ? ""
                        : dates.endDate,
                  })
                }
              />
            </div>
            <div className="min-w-0">
              <LinkedDateField
                label={form.customLatest}
                value={dates.endDate}
                linkedDate={dates.startDate}
                invalid={endInvalid}
                error={endInvalid ? form.endError : ""}
                onChange={(endDate) =>
                  onDatesChange({
                    ...dates,
                    startDate:
                      dates.startDate && endDate && endDate < dates.startDate
                        ? ""
                        : dates.startDate,
                    endDate,
                  })
                }
              />
            </div>
          </div>
        </div>
        <Field label={form.customTimePreference} as="div">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
            {timeOfDay === "exact" ? (
              <div
                className={cn(
                  "col-span-2 sm:col-span-2",
                  "mt-2 flex min-w-0 items-stretch overflow-hidden rounded-xl border border-[#ded9e0] bg-white",
                  exactInvalid &&
                    "border-danger-text ring-2 ring-danger-ring",
                )}
              >
                <VisitSelect
                  ariaLabel={form.customTimePreference}
                  value={timeOfDay}
                  options={timeOptionsWithLabels}
                  onChange={(next) =>
                    onDatesChange({ ...dates, timeOfDay: next })
                  }
                  className="h-11 min-w-0 flex-1 rounded-none border-0 border-r border-[#ded9e0] focus:border-[#ded9e0] focus:ring-0"
                />
                <VisitTimeSelect
                  ariaLabel={form.customExactTime}
                  value={dates.exactTime ?? ""}
                  onChange={(next) =>
                    onDatesChange({ ...dates, exactTime: next })
                  }
                  className="h-11 min-w-0 flex-1 rounded-none border-0"
                />
              </div>
            ) : (
              <div className="sm:col-span-1">
                <VisitSelect
                  ariaLabel={form.customTimePreference}
                  value={timeOfDay}
                  options={timeOptionsWithLabels}
                  onChange={(next) =>
                    onDatesChange({ ...dates, timeOfDay: next })
                  }
                  className="mt-2"
                />
              </div>
            )}
          </div>
          {exactInvalid ? (
            <span
              role="alert"
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-danger-text"
            >
              <PiWarningCircle className="shrink-0" size={12} />
              {form.customExactTimeError}
            </span>
          ) : null}
        </Field>
        <Field label={form.notes} optional>
          <textarea
            value={dates.notes}
            onChange={(event) =>
              onDatesChange({ ...dates, notes: event.target.value })
            }
            className={textareaClass}
            placeholder={form.customPlaceholder}
          />
        </Field>
      </div>
      <div className="hidden lg:block lg:w-[280px]" aria-hidden="true" />
    </div>
  );
}

export function LegacyLinkedDateField({
  label,
  value,
  linkedDate,
  invalid,
  error,
  onChange,
}: {
  label: string;
  value: string;
  linkedDate: string;
  invalid: boolean;
  error: string;
  onChange: (value: string) => void;
}) {
  const { lang, t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const form = needMessages.needPublishing.dateForm;
  const pickerCopy = needMessages.needPublishingClient.schedule;
  const [open, setOpen] = useState(false);
  const initialDate = parseDateValue(value || linkedDate) ?? new Date();
  const [month, setMonth] = useState<Date>(() => startOfMonth(initialDate));
  const [pickerView, setPickerView] = useState<"days" | "months" | "years">(
    "days",
  );
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const decadeStart = (year: number) => Math.floor(year / 10) * 10;
  const [yearPageStart, setYearPageStart] = useState(() =>
    decadeStart(initialDate.getFullYear()),
  );
  const monthLabel = new Intl.DateTimeFormat(lang, { month: "long" }).format(
    month,
  );
  const yearLabel = new Intl.DateTimeFormat(lang, { year: "numeric" }).format(
    month,
  );
  const isMonthInRange = (year: number, monthIndex: number) => {
    const candidate = new Date(year, monthIndex, 1);
    return candidate >= startMonth;
  };
  const isYearInRange = (year: number) => year >= startMonth.getFullYear();
  const canGoToPrevious =
    pickerView === "years"
      ? yearPageStart > decadeStart(startMonth.getFullYear())
      : pickerView === "months"
        ? month.getFullYear() > startMonth.getFullYear()
        : month > startMonth;
  const canGoToNext = true;
  const previousLabel =
    pickerView === "years"
      ? pickerCopy.previous10Years
      : pickerView === "months"
        ? pickerCopy.previousYear
        : pickerCopy.previousMonth;
  const nextLabel =
    pickerView === "years"
      ? pickerCopy.next10Years
      : pickerView === "months"
        ? pickerCopy.nextYear
        : pickerCopy.nextMonth;
  const todayLabel = pickerCopy.today;
  const monthItems = Array.from({ length: 12 }, (_, index) => ({
    index,
    label: new Intl.DateTimeFormat(lang, { month: "short" }).format(
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
      const nextDate = parseDateValue(value || linkedDate) ?? new Date();
      setMonth(startOfMonth(nextDate));
      setYearPageStart(decadeStart(nextDate.getFullYear()));
      setPickerView("days");
    }
    setOpen(next);
  };
  const chooseDate = (date: Date | undefined) => {
    if (!date || date < minDate) return;
    onChange(toDateValue(date));
    setOpen(false);
    setPickerView("days");
  };
  return (
    <Field label={label}>
      <span className="relative block">
        <Popover open={open} onOpenChange={changeOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-invalid={invalid || undefined}
              className={cn(
                inputClass,
                "h-10 w-full max-w-none flex items-center justify-between text-left",
                invalid &&
                  "border-danger-border focus:border-danger-text focus:ring-danger-ring",
              )}
            >
              <span className={value ? "text-[#211d27]" : "text-[#aaa4ae]"}>
                {value ? formatDate(value) : form.selectDate}
              </span>
              <PiCalendarBlank className="shrink-0 text-[var(--primary)]" size={19} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            collisionPadding={12}
            className="z-[70] w-[var(--radix-popover-trigger-width)] max-h-[min(420px,calc(100dvh-128px))] max-w-[calc(100vw-24px)] overflow-y-auto border-[#ded9e0] p-2 [--rdp-accent-color:var(--primary)] [--rdp-accent-background-color:var(--primary-fixed)]"
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
                    setMonth(
                      new Date(month.getFullYear() - 1, month.getMonth(), 1),
                    );
                  } else {
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    );
                  }
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[var(--primary-fixed)] disabled:pointer-events-none disabled:opacity-30"
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
                    className="rounded-lg px-2 py-1 text-sm font-bold text-[#514956] transition hover:bg-[var(--primary-fixed)]"
                  >
                    {yearLabel}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setPickerView("months")}
                      className="rounded-lg px-2 py-1 text-sm font-bold text-[#514956] transition hover:bg-[var(--primary-fixed)]"
                    >
                      {monthLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setYearPageStart(decadeStart(month.getFullYear()));
                        setPickerView("years");
                      }}
                      className="rounded-lg px-2 py-1 text-sm font-bold text-[#514956] transition hover:bg-[var(--primary-fixed)]"
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
                    setMonth(
                      new Date(month.getFullYear() + 1, month.getMonth(), 1),
                    );
                  } else {
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    );
                  }
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[var(--primary-fixed)] disabled:pointer-events-none disabled:opacity-30"
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
                      "h-10 rounded-xl text-xs transition hover:bg-[var(--primary-fixed)]",
                      item.year === month.getFullYear() &&
                        "bg-[var(--primary-fixed)] font-bold text-[var(--primary)]",
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
                      "h-10 rounded-xl px-2 text-xs transition hover:bg-[var(--primary-fixed)]",
                      item.index === month.getMonth() &&
                        "bg-[var(--primary-fixed)] font-bold text-[var(--primary)]",
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
                mode="single"
                month={month}
                onMonthChange={setMonth}
                hideNavigation
                startMonth={startMonth}
                selected={parseDateValue(value)}
                disabled={{ before: minDate }}
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
                          : "text-[#514956] hover:bg-[var(--primary-fixed)]",
                        modifiers.selected &&
                          "border-2 border-[var(--primary)] bg-[var(--primary-fixed)] font-bold text-[var(--primary)] hover:bg-[#e9dff0]",
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
            <div className="flex items-center justify-between border-t border-[#eee9ef] pt-2">
              <button
                type="button"
                onClick={() => chooseDate(minDate)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary-fixed)]"
              >
                {todayLabel}
              </button>
              <button
                type="button"
                disabled={!value}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--primary)] disabled:opacity-35"
              >
                {form.clear}
              </button>
            </div>
          </PopoverContent>
        </Popover>
        {error && (
          <span
            role="alert"
            className="mt-1 inline-flex max-w-full items-start gap-1 text-xs font-medium leading-4 text-danger-text"
          >
            <PiWarningCircle className="shrink-0" size={13} />
            {error}
          </span>
        )}
      </span>
    </Field>
  );
}

export function LinkedDateField({
  label,
  value,
  linkedDate,
  minDate,
  invalid,
  error,
  onChange,
}: {
  label: string;
  value: string;
  linkedDate: string;
  minDate?: Date;
  invalid: boolean;
  error: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const form = needMessages.needPublishing.dateForm;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minimumDate = minDate && minDate > today ? minDate : today;
  return (
    <Field label={label}>
      <span className="relative block">
        <DatePicker
          value={value}
          defaultMonth={parseDateValue(value || linkedDate)}
          minDate={minimumDate}
          placeholder={form.selectDate}
          invalid={invalid}
          clearLabel={form.clear}
          triggerClassName={cn(
            inputClass,
            "h-10 w-full max-w-none",
            invalid &&
              "border-danger-border focus:border-danger-text focus:ring-danger-ring",
          )}
          onChange={onChange}
        />
        {error && (
          <span
            role="alert"
            className="mt-1 inline-flex max-w-full items-start gap-1 text-xs font-medium leading-4 text-danger-text"
          >
            <PiWarningCircle className="shrink-0" size={13} />
            {error}
          </span>
        )}
      </span>
    </Field>
  );
}

export function BoardingStayPlan({
  dates,
}: {
  dates: { startDate: string; endDate: string };
}) {
  const { lang, t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing.boardingStay;
  const startDate = parseDateValue(dates.startDate);
  const endDate = parseDateValue(dates.endDate);
  const startMonth = startDate ? startOfMonth(startDate) : undefined;
  const endMonth = endDate ? startOfMonth(endDate) : undefined;
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(startDate ?? new Date()),
  );
  useEffect(() => {
    const nextStartDate = parseDateValue(dates.startDate);
    if (nextStartDate) setCalendarMonth(startOfMonth(nextStartDate));
  }, [dates.startDate]);
  const nights = boardingNights(dates);
  const isSingleMonth = Boolean(
    startMonth && endMonth && startMonth.getTime() === endMonth.getTime(),
  );
  const canGoPrevious = Boolean(startMonth && calendarMonth > startMonth);
  const canGoNext = Boolean(endMonth && calendarMonth < endMonth);
  const changeMonth = (offset: number) => {
    const next = startOfMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + offset,
        1,
      ),
    );
    if (startMonth && next < startMonth) return setCalendarMonth(startMonth);
    if (endMonth && next > endMonth) return setCalendarMonth(endMonth);
    setCalendarMonth(next);
  };
  return (
    <section className="w-full self-start overflow-hidden rounded-[16px] border border-[#d9cdea] bg-[#f7f3fa] p-4 shadow-[0_16px_34px_-27px_rgba(82,48,112,0.55)] sm:p-5 lg:w-fit lg:self-end">
      <div className="w-full lg:w-[280px]">
        <div className="-mx-4 -mt-4 mb-4 flex min-h-12 items-center justify-between gap-3 border-b border-[#dcd0e6] bg-[#eee7f4] px-4 py-3.5 sm:-mx-5 sm:-mt-5 sm:px-5">
          <p className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#79508b]">
            {copy.stayLength}
          </p>
          <p className="whitespace-nowrap rounded-full bg-[var(--primary-fixed)] px-2.5 py-1 text-[10px] font-bold tabular-nums text-[var(--primary)]">
            {nights} {nights === 1 ? copy.nightSingular : copy.nightPlural}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#dfd5e7] bg-white p-2 shadow-[0_10px_24px_-24px_rgba(65,40,84,0.75)]">
          <div className="flex min-h-10 items-center justify-between border-b border-[#eee9ef] px-0.5 pb-2">
            {isSingleMonth ? (
              <span className="h-9 w-9" aria-hidden="true" />
            ) : (
              <button
                type="button"
                aria-label={copy.previousMonth}
                disabled={!canGoPrevious}
                onClick={() => changeMonth(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[var(--primary-subtle)] disabled:pointer-events-none disabled:opacity-30"
              >
                <PiCaretLeft size={22} />
              </button>
            )}
            <p className="text-sm font-bold text-[#514956]">
              {calendarMonth.toLocaleDateString(lang, {
                month: "long",
                year: "numeric",
              })}
            </p>
            {isSingleMonth ? (
              <span className="h-9 w-9" aria-hidden="true" />
            ) : (
              <button
                type="button"
                aria-label={copy.nextMonth}
                disabled={!canGoNext}
                onClick={() => changeMonth(1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[var(--primary-subtle)] disabled:pointer-events-none disabled:opacity-30"
              >
                <PiCaretRight size={22} />
              </button>
            )}
          </div>
          <DayPicker
            key={`${dates.startDate}:${dates.endDate}`}
            mode="range"
            month={calendarMonth}
            selected={
              startDate && endDate ? { from: startDate, to: endDate } : undefined
            }
            showOutsideDays
            fixedWeeks
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
                      "pointer-events-none relative mx-0 h-8 w-full rounded-none text-xs",
                      modifiers.outside ? "text-[#c8c3c9]" : "text-[#514956]",
                    )}
                  >
                    {inRange && !(isStart && isEnd) ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-y-1",
                          modifiers.outside
                            ? "bg-[#f3edf6]"
                            : "bg-[#e8d9f0]",
                          isStart && "left-1/2 right-0 rounded-l-full",
                          isMiddle && "left-0 right-0",
                          isEnd && "left-0 right-1/2 rounded-r-full",
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 mx-auto grid h-7 w-7 place-items-center rounded-full",
                        (isStart || isEnd) &&
                          !modifiers.outside &&
                          "bg-[var(--primary)] font-extrabold text-white shadow-sm",
                        (isStart || isEnd) &&
                          modifiers.outside &&
                          "bg-[#cbbbd4] font-extrabold text-white",
                        isMiddle &&
                          !modifiers.outside &&
                          "font-bold text-[#5d3a70]",
                        isMiddle &&
                          modifiers.outside &&
                          "font-bold text-[#b4a5bb]",
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                  </button>
                );
              },
            }}
            classNames={{
              root: "w-full overflow-hidden bg-white pb-0.5 pt-2",
              months: "w-full",
              month: "w-full",
              month_grid: "w-full table-fixed",
              day: "h-9 p-0 text-center",
              day_button: "w-full",
              weekday:
                "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
              month_caption: "hidden",
            }}
          />
        </div>
      </div>
    </section>
  );
}

export function VisitDatePlan({
  dates,
  visitFrequency,
  customInterval,
  visitsPerDay,
  showValidation,
}: {
  dates: { startDate: string; endDate: string };
  visitFrequency: string;
  customInterval: number;
  visitsPerDay: number;
  showValidation: boolean;
}) {
  const { lang, t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing.visitSchedule;
  const pickerCopy = needMessages.needPublishingClient.schedule;
  const candidates = buildVisitDateCandidates({
    dates,
    visitFrequency,
    customInterval,
    firstVisitDate: dates.startDate,
  });
  const includedDates = buildVisitDates({
    dates,
    visitFrequency,
    customInterval,
    firstVisitDate: dates.startDate,
  });
  const hasValidRange = Boolean(
    dates.startDate && dates.endDate && dates.startDate <= dates.endDate,
  );
  const noVisitDates = showValidation && hasValidRange && !includedDates.length;
  const startDate = parseDateValue(dates.startDate);
  const endDate = parseDateValue(dates.endDate);
  const calendarStartMonth = startDate
    ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    : undefined;
  const calendarEndMonth = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    : undefined;
  const isSingleCalendarMonth =
    calendarStartMonth &&
    calendarEndMonth &&
    calendarStartMonth.getTime() === calendarEndMonth.getTime();
  const candidateDateSet = new Set(candidates);
  const initialCalendarDate = parseDateValue(dates.startDate);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    startOfMonth(initialCalendarDate ?? new Date()),
  );
  useEffect(() => {
    const rangeStart = parseDateValue(dates.startDate);
    const rangeEnd = parseDateValue(dates.endDate);
    const nextMonth = parseDateValue(dates.startDate);
    if (!nextMonth) return;
    if (rangeStart && nextMonth < rangeStart) {
      setCalendarMonth(startOfMonth(rangeStart));
      return;
    }
    if (rangeEnd && nextMonth > rangeEnd) {
      setCalendarMonth(startOfMonth(rangeEnd));
      return;
    }
    setCalendarMonth(startOfMonth(nextMonth));
  }, [dates.startDate, dates.endDate]);
  const changeCalendarMonth = (offset: number) => {
    const nextMonth = startOfMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + offset,
        1,
      ),
    );
    if (calendarStartMonth && nextMonth < calendarStartMonth) {
      setCalendarMonth(calendarStartMonth);
      return;
    }
    if (calendarEndMonth && nextMonth > calendarEndMonth) {
      setCalendarMonth(calendarEndMonth);
      return;
    }
    setCalendarMonth(nextMonth);
  };
  const canGoToPreviousMonth = Boolean(
    calendarStartMonth && calendarMonth > calendarStartMonth,
  );
  const canGoToNextMonth = Boolean(
    calendarEndMonth && calendarMonth < calendarEndMonth,
  );
  const totalVisitCount = includedDates.length * visitsPerDay;
  const totalDaysCount = includedDates.length;
  return (
    <section className="w-full self-start overflow-hidden rounded-[16px] border border-[#d9cdea] bg-[#f7f3fa] p-4 shadow-[0_16px_34px_-27px_rgba(82,48,112,0.55)] sm:p-5 lg:w-fit lg:self-end">
      {candidates.length ? (
        <div className="w-full lg:w-[280px]">
          <div className="-mx-4 -mt-4 mb-4 flex min-h-12 items-center justify-between gap-3 border-b border-[#dcd0e6] bg-[#eee7f4] px-4 py-3.5 sm:-mx-5 sm:-mt-5 sm:px-5">
            <p className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#79508b]">
              {copy.plannedDays}
            </p>
            <p className="whitespace-nowrap rounded-full bg-[var(--primary-fixed)] px-2.5 py-1 text-[10px] font-bold tabular-nums text-[var(--primary)]">
              {totalVisitCount} {totalVisitCount === 1 ? copy.visitSingular : copy.visitPlural}{" "}
              · {totalDaysCount} {totalDaysCount === 1 ? pickerCopy.daySingular : pickerCopy.dayPlural}
            </p>
          </div>
          <div className="rounded-[14px] border border-[#dfd5e7] bg-white p-2 shadow-[0_10px_24px_-24px_rgba(65,40,84,0.75)]">
            <div className="flex min-h-10 items-center justify-between border-b border-[#eee9ef] px-0.5 pb-2">
              {isSingleCalendarMonth ? (
                <span className="h-8 w-8" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  aria-label={copy.previousMonth}
                  disabled={!canGoToPreviousMonth}
                  onClick={() => changeCalendarMonth(-1)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--primary)] transition hover:border-[#e1d8ef] hover:bg-[var(--primary-subtle)] disabled:pointer-events-none disabled:opacity-30"
                >
                  <PiCaretLeft size={22} />
                </button>
              )}
              <p className="text-sm font-bold text-[#514956]">
                {calendarMonth.toLocaleDateString(lang, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {isSingleCalendarMonth ? (
                <span className="h-8 w-8" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  aria-label={copy.nextMonth}
                  disabled={!canGoToNextMonth}
                  onClick={() => changeCalendarMonth(1)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--primary)] transition hover:border-[#e1d8ef] hover:bg-[var(--primary-subtle)] disabled:pointer-events-none disabled:opacity-30"
                >
                  <PiCaretRight size={22} />
                </button>
              )}
            </div>
            <DayPicker
              mode="single"
              month={calendarMonth}
              showOutsideDays
              fixedWeeks
              startMonth={calendarStartMonth}
              endMonth={calendarEndMonth}
              hideNavigation
              disabled={
                startDate && endDate
                  ? [{ before: startDate }, { after: endDate }]
                  : () => true
              }
              components={{
                DayButton: ({ day, modifiers, className, ...props }) => {
                  const date = toDateValue(day.date);
                  const isPlanned = candidateDateSet.has(date);
                  const isInRequestRange = Boolean(
                    startDate &&
                      endDate &&
                      day.date >= startDate &&
                      day.date <= endDate,
                  );
                  return (
                    <button
                      {...props}
                      tabIndex={-1}
                      className={cn(
                        className,
                        "pointer-events-none h-7 w-7 rounded-full text-xs transition",
                        !isPlanned &&
                          ((modifiers.disabled || modifiers.outside)
                            ? "text-[#c8c3c9]"
                            : "text-[#514956]"),
                        isInRequestRange &&
                          !isPlanned &&
                          !modifiers.outside &&
                          "font-bold text-[#3f3945]",
                        isPlanned &&
                          !modifiers.outside &&
                          "h-[26px] w-[26px] border-2 border-[var(--primary)] bg-white font-extrabold text-[var(--primary)]",
                        isPlanned &&
                          modifiers.outside &&
                          "h-[26px] w-[26px] border-2 border-[#d4c7dc] bg-[#faf8fb] font-extrabold text-[#b09bb9]",
                      )}
                    />
                  );
                },
              }}
              classNames={{
                root:
                  "w-full overflow-hidden bg-white pb-0.5 pt-2 lg:max-w-[280px]",
                months: "w-full",
                month: "w-full",
                month_grid: "w-full table-fixed",
                day: "h-9 p-0 text-center",
                day_button: "mx-auto",
                weekday:
                  "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
                month_caption: "hidden",
              }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-5 w-full rounded-xl border border-dashed border-[#ded9e0] px-4 py-3 text-sm text-[#817a85] lg:max-w-[280px]">
          {copy.addDates}
        </p>
      )}

      {noVisitDates && (
        <p role="alert" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-danger-text">
          <PiWarningCircle className="shrink-0" size={13} />
          {copy.keepOne}
        </p>
      )}
    </section>
  );
}

export function VisitTimeSelect({
  value,
  onChange,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <input
      type="time"
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        inputClass,
        "time-picker-input h-10 w-full min-w-0 px-3",
        className,
      )}
    />
  );
}

export function VisitScheduleScreen({
  value,
  onChange,
  customInterval,
  onCustomIntervalChange,
  showValidation,
  visitsPerDay,
  onVisitCountChange,
  visitTimes,
  exactTimes,
  onVisitTimesChange,
  onExactTimesChange,
}: {
  value: string;
  onChange: (value: string) => void;
  customInterval: number;
  onCustomIntervalChange: (value: number) => void;
  showValidation: boolean;
  visitsPerDay: number;
  onVisitCountChange: (value: number) => void;
  visitTimes: string[];
  exactTimes: string[];
  onVisitTimesChange: (value: string[]) => void;
  onExactTimesChange: (value: string[]) => void;
}) {
  const { lang, t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing.visitSchedule;
  const timeLabels = needMessages.needPublishing.timeOptions;
  const options = [
    { id: "every-day", label: copy.everyDay },
    { id: "every-2-days", label: copy.every2Days },
    { id: "every-3-days", label: copy.every3Days },
    { id: "custom", label: copy.customInterval },
  ];
  const [intervalDraft, setIntervalDraft] = useState(
    String(customInterval || 4),
  );
  useEffect(() => {
    setIntervalDraft(String(Math.max(1, customInterval || 4)));
  }, [customInterval]);
  const updateTime = (index: number, next: string) =>
    onVisitTimesChange(
      Array.from({ length: visitsPerDay }, (_, itemIndex) =>
        itemIndex === index ? next : visitTimes[itemIndex] || "flexible",
      ),
    );
  const updateExact = (index: number, next: string) =>
    onExactTimesChange(
      Array.from({ length: visitsPerDay }, (_, itemIndex) =>
        itemIndex === index ? next : exactTimes[itemIndex] || "",
      ),
    );
  const chooseFrequency = (next: string) => {
    if (next === "custom") {
      const interval = Math.max(1, customInterval || 4);
      setIntervalDraft(String(interval));
      onCustomIntervalChange(interval);
    }
    onChange(next);
  };
  const changeIntervalDraft = (next: string) => {
    const digits = next.replace(/\D/g, "");
    setIntervalDraft(digits);
    if (!digits) return;
    onCustomIntervalChange(Math.max(1, Number(digits)));
  };
  const normalizeInterval = () => {
    if (Number(intervalDraft) >= 1) return;
    setIntervalDraft("1");
    onCustomIntervalChange(1);
  };
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <section
          className={cn("min-w-0", value === "custom" && "sm:col-span-2")}
        >
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            {copy.visitingDays}
          </label>
          {value === "custom" ? (
            <div className="mt-2 flex h-11 w-full overflow-hidden rounded-xl border border-[#ded9e0] bg-white">
              <VisitSelect
                ariaLabel={copy.visitingDays}
                value={value}
                options={options.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                onChange={chooseFrequency}
                className="h-11 min-w-0 flex-1 rounded-none border-0 border-r border-[#ded9e0] focus:border-[#ded9e0] focus:ring-0"
              />
              <div className="flex h-11 min-w-0 flex-1 items-center gap-1.5 px-2.5">
                <span className="shrink-0 text-sm text-[#706a78]">
                  {copy.every}
                </span>
                <input
                  aria-label={copy.intervalLabel}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={intervalDraft}
                  onChange={(event) => changeIntervalDraft(event.target.value)}
                  onBlur={normalizeInterval}
                  className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-sm text-[#211d27] outline-none focus:ring-0"
                />
                <span className="shrink-0 text-sm text-[#706a78]">
                  {copy.days}
                </span>
              </div>
            </div>
          ) : (
            <VisitSelect
              ariaLabel={copy.visitingDays}
              value={value}
              options={options.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
              onChange={chooseFrequency}
              className="mt-2"
            />
          )}
        </section>
        <section
          className={cn("min-w-0", value === "custom" && "sm:col-start-3")}
        >
          <label className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.1em] text-[#8a5d34]">
            {copy.visitsEachDay}
          </label>
          <VisitSelect
            ariaLabel={copy.visitsEachDay}
            value={String(visitsPerDay)}
            options={[1, 2, 3, 4, 5, 6].map((count) => ({
              value: String(count),
              label: `${count} ${count === 1 ? copy.visitSingular : copy.visitPlural}`,
            }))}
            onChange={(next) => onVisitCountChange(Number(next))}
            className="mt-2"
          />
        </section>
      </div>
      <div className="flex flex-col gap-5">
        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            {copy.preferredTime}
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {Array.from({ length: visitsPerDay }, (_, index) => {
              const visitLabel = copy.visit.includes("{n}")
                ? copy.visit.replace("{n}", String(index + 1))
                : `${copy.visit} ${index + 1}`;
              const exactTimeInvalid =
                showValidation &&
                visitTimes[index] === "exact" &&
                !exactTimes[index];
              return (
                <div
                  key={index}
                  className={cn(
                    "min-w-0",
                    visitTimes[index] === "exact" && "col-span-2 md:col-span-2",
                  )}
                >
                  <p className="mb-2 text-xs font-semibold text-[#706a78]">
                    {visitLabel}
                  </p>
                  <div
                    className={cn(
                      visitTimes[index] === "exact"
                        ? cn(
                            "flex min-w-0 overflow-hidden rounded-xl border border-[#ded9e0] bg-white",
                            exactTimeInvalid &&
                              "border-danger-text ring-2 ring-danger-ring",
                          )
                        : "block",
                    )}
                  >
                    <VisitSelect
                      ariaLabel={`${visitLabel} ${copy.preferredTime}`}
                      value={visitTimes[index] || "flexible"}
                      options={timeOptions.map((option) => ({
                        value: option.value,
                        label:
                          timeLabels[option.value as keyof typeof timeLabels],
                      }))}
                      onChange={(next) => updateTime(index, next)}
                      className={cn(
                        "h-10",
                        visitTimes[index] === "exact" &&
                          "min-w-0 flex-1 rounded-none border-0 border-r border-[#ded9e0] focus:border-[#ded9e0] focus:ring-0",
                      )}
                    />
                    {visitTimes[index] === "exact" ? (
                      <VisitTimeSelect
                        ariaLabel={
                          copy.exactTime.includes("{n}")
                            ? copy.exactTime.replace("{n}", String(index + 1))
                            : `${visitLabel} ${copy.exactTime}`
                        }
                        value={exactTimes[index] || ""}
                        onChange={(next) => updateExact(index, next)}
                        className="h-10 min-w-0 flex-1 rounded-none border-0 focus:border-transparent focus:ring-0"
                      />
                    ) : null}
                  </div>
                  {exactTimeInvalid ? (
                    <p
                      role="alert"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-danger-text"
                    >
                      <PiWarningCircle className="shrink-0" size={12} />
                      {needMessages.needPublishingClient.schedule.exactTimeError}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// Compatibility exports
export const StepSchedule = VisitDatesScreen;
export const StepDates = DatesScreen;
export const StepBoardingDates = BoardingDatesScreen;
export const StepVisitDates = VisitDatesScreen;
export const StepCustomDates = CustomDatesScreen;
export const StepScheduleBoarding = BoardingDatesScreen;
export const StepScheduleCustom = CustomDatesScreen;
export const StepScheduleVisitDates = VisitDatesScreen;
export const StepScheduleVisitTiming = VisitScheduleScreen;
export const GuidedNeedScheduleStep = VisitDatesScreen;
