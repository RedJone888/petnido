"use client";

import { useState, useRef, useEffect } from "react";
import { LocationSource } from "@/domain/location/types";
import cn from "@/lib/cn";
type Option = {
  label: string;
  subLabel?: string;
  lat: number;
  lon: number;
};
type Props = {
  source: LocationSource;
  value: string;
  results: Option[];
  loading?: boolean;
  disabled: boolean;
  onInputChange: (text: string) => void;
  onSearchSelect: (item: { label: string; lat: number; lon: number }) => void;
  placeholder?: string;
  className?: string;
};
export default function LocationInput({
  source,
  value,
  results,
  loading,
  disabled,
  onInputChange,
  onSearchSelect,
  placeholder = "住所・駅名・エリアを入力してください",
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    <div ref={containerRef} className="relative group w-full">
      {/* 输入框 */}
      <input
        type="text"
        ref={inputRef}
        className={cn(
          "border border-border bg-white rounded-xl",
          "px-3 py-2 w-full text-xs font-medium",
          "focus:outline-none focus:border-primary disabled:text-gray-500",
          className,
        )}
        placeholder={placeholder}
        value={labelDraft}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value.trim();
          setLabelDraft(v);
          if (v) {
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
      {labelDraft && (
        <button
          type="button"
          onClick={() => {
            setLabelDraft("");
            inputRef.current?.focus();
            setOpen(false);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      )}

      {open && (
        <div className="absolute mt-1 w-full border border-border bg-white rounded-lg shadow z-20 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-xs text-neutral-500">検索中…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-500">
              該当する住所がありません
            </div>
          ) : (
            results.map((opt, i) => (
              <div
                key={i}
                onClick={() => {
                  onSearchSelect({
                    label: opt.label,
                    lat: opt.lat,
                    lon: opt.lon,
                  });
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100"
              >
                <span className="font-semibold text-sm">{opt.label} </span>
                {opt.subLabel && (
                  <span className="text-muted-foreground text-xs">
                    {opt.subLabel}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
