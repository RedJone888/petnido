"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAdaptiveDropdownPlacement } from "@/hooks/useAdaptiveDropdownPlacement";
import cn from "@/lib/cn";

export const supportedCurrencies = [
  "JPY",
  "USD",
  "EUR",
  "CNY",
  "TWD",
  "KRW",
  "GBP",
] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

const currencyOptions: Array<{
  value: SupportedCurrency;
  flag: string;
  name: string;
}> = [
  { value: "JPY", flag: "🇯🇵", name: "Japanese Yen" },
  { value: "USD", flag: "🇺🇸", name: "US Dollar" },
  { value: "EUR", flag: "🇪🇺", name: "Euro" },
  { value: "CNY", flag: "🇨🇳", name: "Chinese Yuan" },
  { value: "TWD", flag: "🇹🇼", name: "New Taiwan Dollar" },
  { value: "KRW", flag: "🇰🇷", name: "Korean Won" },
  { value: "GBP", flag: "🇬🇧", name: "British Pound" },
];

export function CurrencyPicker({
  id,
  value,
  onChange,
  ariaLabel,
  className,
  triggerClassName,
}: {
  id?: string;
  value: SupportedCurrency;
  onChange: (value: SupportedCurrency) => void;
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const dropdown = useAdaptiveDropdownPlacement(open, pickerRef);
  const selectedOption =
    currencyOptions.find((option) => option.value === value) ??
    currencyOptions[0];

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={pickerRef} className={cn("relative min-w-0", className)}>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 transition hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-purple-100",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="text-lg leading-none" aria-hidden="true">
            {selectedOption.flag}
          </span>
          <span className="min-w-0 truncate">
            <span className="font-bold">{selectedOption.value}</span>
            <span className="ml-2 text-slate-500">{selectedOption.name}</span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-slate-500 transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute inset-x-0 z-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl",
            dropdown.placement === "top"
              ? "bottom-full mb-2"
              : "top-full mt-2",
          )}
          style={{ maxHeight: dropdown.maxHeight }}
        >
          {currencyOptions.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  selected
                    ? "bg-[var(--primary-subtle)]"
                    : "hover:bg-slate-50",
                )}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {option.flag}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900">
                    {option.value}
                  </span>
                  <span className="ml-2 text-sm text-slate-500">
                    {option.name}
                  </span>
                </span>
                {selected ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
