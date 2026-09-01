"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Currency } from "@prisma/client";

import { CURRENCY_META } from "@/domain/location/constants";

import CurrencyFlag from "@/components/location/CurrencyFlag";
import { LabelObj } from "@/domain/location/types";
import cn from "@/lib/cn";
import { useLanguage } from "@/components/providers/language-provider";

type CurrencyOption = {
  currency: Currency;
  label: LabelObj;
  symbol: string;
};

type Props = {
  currency: Currency | null;
  onChange: (c: Currency) => void;
  disabled?: boolean;
  size?: number;
  triggerClass?: string;
  dorpdownClass?: string;
  commonClass?: string;
  flagClass?: string;
};

export default function CurrencySelect({
  currency,
  onChange,
  disabled,
  size = 16,
  triggerClass = "",
  dorpdownClass = "",
  commonClass = "",
  flagClass = "",
}: Props) {
  const { t, lang } = useLanguage();
  const copy = t.location;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /* ---------- options ---------- */
  const options: CurrencyOption[] = useMemo(() => {
    return Object.values(Currency).map((c) => {
      const target = CURRENCY_META[c];
      return {
        currency: c,
        label: target.label[lang],
        symbol: target.symbol,
      };
    });
  }, [lang]);

  /* ---------- filter ---------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    return options.filter((o) => {
      return (
        o.currency.toLowerCase().includes(q) || // JPY / USD
        o.label.long.toLowerCase().includes(q) || // 日本円
        o.symbol.includes(q) // ¥ $
      );
    });
  }, [options, query]);

  /* ---------- click outside ---------- */
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* ---------- open focus ---------- */
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const selected = options.find((o) => o.currency === currency);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={copy.chooseCurrency}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "w-full rounded-xl border border-border bg-white px-3 py-2 text-left text-xs font-medium",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary",
          triggerClass,
          commonClass,
        )}
      >
        {selected ? (
          <CurrencyFlag
            currency={selected.currency}
            size={size}
            className={flagClass}
          />
        ) : (
          <span className="text-muted-foreground">{copy.chooseCurrency}</span>
        )}
      </button>

      {/* dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label={copy.chooseCurrency}
          className={cn(
            "absolute z-30 mt-1 w-full rounded-xl border border-border bg-white shadow text-xs",
            dorpdownClass,
            commonClass,
          )}
        >
          {/* search */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              aria-label={copy.currencySearch}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.currencySearch}
              className="w-full rounded-md text-center border border-border px-2 py-1 focus:outline-none"
            />
          </div>

          {/* list */}
          <ul role="listbox" className="max-h-40 overflow-y-auto">
            {filtered.length === 0 ? (
                <li className="px-3 py-2 text-muted-foreground" role="status">
                {copy.currencyNoMatches}
              </li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.currency}
                  role="option"
                  aria-selected={o.currency === currency}
                  tabIndex={0}
                  onClick={() => {
                    onChange(o.currency);
                    setOpen(false);
                    setQuery("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onChange(o.currency);
                      setOpen(false);
                      setQuery("");
                    }
                  }}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                >
                  <CurrencyFlag
                    currency={o.currency}
                    size={size}
                    className={flagClass}
                  />
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
