"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import { enUS, ja, zhCN } from "date-fns/locale";
import { PiCalendarBlank, PiCaretDown, PiPawPrint } from "react-icons/pi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { DatePicker } from "@/components/ui/date-picker";
import type { Lang } from "@/domain/lang/types";
import cn from "@/lib/cn";
import { otherTypeIcons, type OptionIcon } from "./pet-profile-icons";

export type SelectOption = { value: string; label: string; icon?: OptionIcon };

export const selectPrompts: Record<Lang, string> = {
  en: "Select",
  zh: "请选择",
  ja: "選択してください",
};

export function IconSelect({
  value,
  options,
  onChange,
  placeholder,
  triggerClassName,
  invalid = false,
  ariaDescribedBy,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  triggerClassName?: string;
  invalid?: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-describedby={ariaDescribedBy}
          data-invalid={invalid || undefined}
          className={cn(
            "mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-purple-100",
            invalid &&
              "border-danger-border focus:border-danger-text focus:ring-danger-ring",
            triggerClassName,
          )}
        >
          <span
            className={
              selected ? "flex min-w-0 items-center gap-2" : "text-slate-400"
            }
          >
            {SelectedIcon ? (
              <SelectedIcon className="h-5 w-5 shrink-0 text-primary" />
            ) : null}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <PiCaretDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[1200] w-[var(--radix-popover-trigger-width)] min-w-0 p-1.5"
      >
        <div className="space-y-1">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value || "empty"}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-purple-50",
                  option.value === value &&
                    "bg-purple-50 font-semibold text-primary",
                )}
              >
                {Icon ? (
                  <Icon className="h-5 w-5 shrink-0" />
                ) : (
                  <span className="h-5 w-5 shrink-0" />
                )}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function OtherTypeField({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  connected = false,
  invalid = false,
  ariaDescribedBy,
}: {
  value: string;
  options: Array<{ key: string; label: string }>;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  connected?: boolean;
  invalid?: boolean;
  ariaDescribedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const matchedOption = options.find(
    (option) =>
      option.label.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
  );
  const MatchedIcon = matchedOption
    ? (otherTypeIcons[matchedOption.key] ?? PiPawPrint)
    : null;
  return (
    <div className="relative" onBlur={() => setOpen(false)}>
      <div
        className={cn(
          "relative mt-2 h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-purple-100",
          connected && "rounded-l-none border-l-0",
          invalid &&
            "border-danger-border focus-within:border-danger-text focus-within:ring-danger-ring",
        )}
      >
        {MatchedIcon ? (
          <MatchedIcon className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2" />
        ) : null}
        <input
          maxLength={80}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          aria-describedby={ariaDescribedBy}
          placeholder={placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          className={cn(
            "h-full w-full border-0 bg-transparent px-3 pr-10 text-sm text-slate-900 outline-none focus:ring-0",
            MatchedIcon && "pl-11",
          )}
        />
        {value ? (
          <button
            type="button"
            aria-label={ariaLabel}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-[80] w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {options.map((option) => {
            const Icon = otherTypeIcons[option.key] ?? PiPawPrint;
            return (
              <button
                key={option.key}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.label);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-purple-50"
              >
                <Icon className="h-6 w-6" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SuggestionField({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onBlur={() => setOpen(false)}>
      <div className="relative mt-2 h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-purple-100">
        <input
          maxLength={120}
          aria-label={ariaLabel}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          className="h-full w-full border-0 bg-transparent px-3 pr-10 text-sm text-slate-900 outline-none focus:ring-0"
        />
        {value ? (
          <button
            type="button"
            aria-label={ariaLabel}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        ) : null}
      </div>
      {open && options.length ? (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-[80] w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-purple-50"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function UnitSelect({
  value,
  onChange,
}: {
  value: "kg" | "g";
  onChange: (value: "kg" | "g") => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="pet-weight-control relative flex h-full w-[76px] items-center justify-between px-3 text-sm text-slate-800 outline-none before:absolute before:left-0 before:top-1/2 before:h-6 before:w-px before:-translate-y-1/2 before:bg-slate-200 hover:bg-slate-50"
        >
          <span>{value}</span>
          <PiCaretDown className="h-4 w-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[1200] w-[var(--radix-popover-trigger-width)] min-w-0 p-1"
      >
        <button
          type="button"
          onClick={() => {
            onChange("kg");
            setOpen(false);
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-purple-50"
        >
          kg
        </button>
        <button
          type="button"
          onClick={() => {
            onChange("g");
            setOpen(false);
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-purple-50"
        >
          g
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function FieldCaption({
  label,
  optional,
}: {
  label: string;
  optional?: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
      {label}
      {optional ? (
        <span className="text-[10px] font-medium normal-case tracking-normal text-slate-400">
          {optional}
        </span>
      ) : null}
    </span>
  );
}

export const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100";

export const textareaClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100";
