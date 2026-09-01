"use client";

import { useState, useRef, useEffect, useId } from "react";
import { LocationSource } from "@/domain/location/types";
import cn from "@/lib/cn";
import { useLanguage } from "@/components/providers/language-provider";
type Option = {
  label: string;
  subLabel?: string;
  regionLabel?: string | null;
  lat: number;
  lon: number;
};
type Props = {
  inputId?: string;
  source: LocationSource;
  value: string;
  results: Option[];
  loading?: boolean;
  disabled: boolean;
  onInputChange: (text: string) => void;
  onSearchSelect: (item: { label: string; regionLabel?: string | null; lat: number; lon: number }) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  dropdownClassName?: string;
  hideClearButton?: boolean;
  borderless?: boolean;
};
export default function LocationInput({
  inputId,
  source,
  value,
  results,
  loading,
  disabled,
  onInputChange,
  onSearchSelect,
  placeholder,
  className = "",
  containerClassName = "",
  dropdownClassName = "",
  hideClearButton = false,
  borderless = false,
}: Props) {
  const { t } = useLanguage();
  const copy = t.location;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState(value);
  const [isComposing, setIsComposing] = useState(false);
  /* --- 点击外部关闭 --- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    setLabelDraft(value);
  }, [value]);

  return (
    <div ref={containerRef} className={cn("relative group w-full", containerClassName)}>
      {/* 输入框 */}
      <input
        id={inputId}
        type="text"
        ref={inputRef}
        role="combobox"
        aria-label={copy.mapSelection}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        style={borderless ? { outline: "none", outlineOffset: 0, boxShadow: "none" } : undefined}
        className={cn(
          borderless
            ? "borderless-input !outline-none !ring-0 !border-none !shadow-none border-0 bg-transparent rounded-none px-0 py-0 w-full text-xs font-medium focus:!outline-none focus-visible:!outline-none focus:ring-0 focus:border-0 focus:border-transparent shadow-none disabled:text-gray-500"
            : "border border-border bg-white rounded-xl px-3 py-2 w-full text-xs font-medium focus:outline-none focus:border-primary disabled:text-gray-500",
          className,
        )}
        placeholder={placeholder || copy.mapSelection}
        value={labelDraft}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          setLabelDraft(v);
          if (v.trim()) {
            if (!isComposing) {
              onInputChange(v);
              setOpen(true);
            }
          } else {
            setOpen(false);
          }
        }}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => {
          setIsComposing(false);
          onInputChange(e.currentTarget.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (labelDraft && source === "search") {
            setOpen(true);
          }
        }}
      />
      {/* 清空按钮 */}
      {!hideClearButton && labelDraft && (
        <button
          type="button"
          aria-label={copy.clear}
          onClick={() => {
            setLabelDraft("");
            onInputChange("");
            inputRef.current?.focus();
            setOpen(false);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      )}

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute mt-1 w-full border border-border bg-white rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto p-1",
            dropdownClassName,
          )}
        >
          {loading ? (
            <div className="px-3 py-2 text-xs text-neutral-500" role="status">
              {copy.searching}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-500" role="status">
              {copy.noResults}
            </div>
          ) : (
            results.map((opt, i) => (
              <div
                key={i}
                role="option"
                aria-selected={false}
                tabIndex={0}
                onClick={() => {
                  onSearchSelect({
                    label: opt.label,
                    regionLabel: opt.regionLabel,
                    lat: opt.lat,
                    lon: opt.lon,
                  });
                  setOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSearchSelect({
                      label: opt.label,
                      regionLabel: opt.regionLabel,
                      lat: opt.lat,
                      lon: opt.lon,
                    });
                    setOpen(false);
                  }
                }}
                className="flex flex-col rounded-lg px-2.5 py-2 text-left hover:bg-purple-50/80 cursor-pointer transition"
              >
                <span className="font-semibold text-xs text-slate-800 leading-tight truncate">
                  {opt.label}
                </span>
                {opt.subLabel ? (
                  <span className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 truncate">
                    {opt.subLabel}
                  </span>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
