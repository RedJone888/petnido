"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import cn from "@/lib/cn";

export function DateFilter({
  label,
  from,
  to,
  fromLabel,
  toLabel,
  clearLabel,
  applyLabel,
  errorLabel,
  onApply,
  onClear,
}: {
  label: string;
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  clearLabel: string;
  applyLabel: string;
  errorLabel: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setDraftFrom(from);
      setDraftTo(to);
    }
    setOpen(nextOpen);
  }

  const isDraftInvalid = Boolean(
    draftFrom && draftTo && draftFrom >= draftTo,
  );
  const isFiltered = Boolean(from || to);

  const displayLabel =
    from && to
      ? `${from} ~ ${to}`
      : from
        ? `≥ ${from}`
        : to
          ? `≤ ${to}`
          : label;

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
          aria-label={`${label}: ${displayLabel}`}
        >
          <Calendar
            size={13.5}
            className={cn(
              "shrink-0 transition-colors",
              isFiltered ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
            )}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">{displayLabel}</span>
          {isFiltered ? (
            <span className="inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-purple-100" />
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
            <Calendar size={13.5} className="text-primary" />
            {label}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[11px] font-bold text-slate-600">
              <span>{fromLabel}</span>
              <input
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-slate-600">
              <span>{toLabel}</span>
              <input
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={(event) => setDraftTo(event.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </label>
          </div>
          {isDraftInvalid ? (
            <p
              role="alert"
              className="rounded-lg bg-danger-bg px-2 py-1 text-[11px] font-bold text-danger-text"
            >
              {errorLabel}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-2">
          <button
            type="button"
            onClick={() => {
              setDraftFrom("");
              setDraftTo("");
              onClear();
              setOpen(false);
            }}
            disabled={!draftFrom && !draftTo && !from && !to}
            className="text-[11px] font-bold text-slate-500 transition hover:text-slate-800 disabled:opacity-35"
          >
            {clearLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isDraftInvalid) {
                onApply(draftFrom, draftTo);
                setOpen(false);
              }
            }}
            disabled={isDraftInvalid}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applyLabel}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
