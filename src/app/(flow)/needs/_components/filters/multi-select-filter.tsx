"use client";

import { useState, type ElementType } from "react";
import { Check, ChevronDown, PawPrint } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import cn from "@/lib/cn";
import type { FilterOption } from "./filter-types";

export function MultiSelectFilter({
  icon: Icon,
  allLabel,
  filterLabel,
  selected,
  options,
  clearLabel,
  applyLabel,
  onApply,
}: {
  icon?: ElementType;
  allLabel: string;
  filterLabel: string;
  selected: string[];
  options: FilterOption[];
  clearLabel: string;
  applyLabel: string;
  onApply: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const isFiltered = selected.length > 0;

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) setDraft(selected);
    setOpen(nextOpen);
  }

  function toggleOption(value: string) {
    setDraft((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length > 0 ? next : [];
      }
      return [...current, value];
    });
  }

  const displayLabel =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label || filterLabel
        : filterLabel;

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            isFiltered
              ? "border-primary/80 bg-purple-50/90 text-primary shadow-xs ring-1 ring-primary/25 hover:bg-purple-100/80 hover:border-primary"
              : "border-slate-200/90 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          )}
          aria-label={`${filterLabel}: ${displayLabel}`}
        >
          {Icon ? (
            <Icon
              size={13.5}
              className={cn(
                "shrink-0 transition-colors",
                isFiltered ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
              )}
              aria-hidden="true"
            />
          ) : null}
          <span className="whitespace-nowrap">{displayLabel}</span>
          {isFiltered ? (
            <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white shadow-xs">
              {selected.length}
            </span>
          ) : null}
          <ChevronDown
            size={12}
            className={cn(
              "shrink-0 transition-transform duration-200",
              isFiltered ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
              open ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[1200] w-[270px] rounded-2xl p-0 shadow-2xl border border-slate-200/80 bg-white overflow-hidden"
        align="start"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 bg-slate-50/60">
          <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            {Icon ? <Icon size={13.5} className="text-primary" /> : null}
            {filterLabel}
          </span>
          {draft.length > 0 ? (
            <span className="text-[10.5px] font-bold text-primary bg-purple-100/70 rounded-full px-2 py-0.5">
              已选 {draft.length}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-[260px] overflow-y-auto p-2">
          <button
            type="button"
            aria-pressed={draft.length === 0}
            onClick={() => setDraft([])}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-2 text-left text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              draft.length === 0
                ? "bg-purple-50/90 text-primary font-bold"
                : "text-slate-700 hover:bg-slate-100/70",
            )}
          >
            {Icon ? (
              <Icon size={13.5} className={cn("shrink-0", draft.length === 0 ? "text-primary" : "text-slate-400")} aria-hidden="true" />
            ) : (
              <PawPrint size={13.5} className={cn("shrink-0", draft.length === 0 ? "text-primary" : "text-slate-400")} />
            )}
            <span className="min-w-0 flex-1 truncate">{allLabel}</span>
            {draft.length === 0 ? (
              <Check
                size={13}
                strokeWidth={3}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
          {options.map((option) => {
            const active = draft.includes(option.value);
            const OptIcon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-2 text-left text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  active
                    ? "bg-purple-50/90 text-primary font-bold"
                    : "text-slate-700 hover:bg-slate-100/70",
                )}
              >
                <OptIcon
                  size={13.5}
                  className={cn("shrink-0", active ? "text-primary" : "text-slate-400")}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {active ? (
                  <Check
                    size={13}
                    strokeWidth={3}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-2">
          <button
            type="button"
            onClick={() => setDraft([])}
            className="text-[11px] font-bold text-slate-500 transition hover:text-slate-800"
          >
            {clearLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 active:scale-95"
          >
            {applyLabel}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
