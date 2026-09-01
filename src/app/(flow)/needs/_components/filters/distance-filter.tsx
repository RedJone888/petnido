"use client";

import { useState } from "react";
import { Check, ChevronDown, Compass } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import type { Lang } from "@/domain/lang/types";
import cn from "@/lib/cn";

export function DistanceFilter({
  lang,
  radiusKm,
  disabled = false,
  filterLabel,
  onChange,
}: {
  lang: Lang;
  radiusKm: number;
  disabled?: boolean;
  filterLabel: string;
  onChange: (radius: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const isCustom = radiusKm !== 25;

  const options = [
    {
      value: 10,
      label:
        lang === "zh"
          ? "10 km 以内"
          : lang === "ja"
            ? "10 km 以内"
            : "Within 10 km",
    },
    {
      value: 25,
      label:
        lang === "zh"
          ? "25 km 以内（默认）"
          : lang === "ja"
            ? "25 km 以内（既定）"
            : "Within 25 km (Default)",
    },
    {
      value: 50,
      label:
        lang === "zh"
          ? "50 km 以内"
          : lang === "ja"
            ? "50 km 以内"
            : "Within 50 km",
    },
    {
      value: 100,
      label:
        lang === "zh"
          ? "100 km 以内"
          : lang === "ja"
            ? "100 km 以内"
            : "Within 100 km",
    },
    {
      value: 0,
      label:
        lang === "zh"
          ? "不限距离"
          : lang === "ja"
            ? "距離制限なし"
            : "Any distance",
    },
  ];

  const currentLabel =
    radiusKm === 0
      ? lang === "zh"
        ? "不限"
        : lang === "ja"
          ? "不限"
          : "Any"
      : `${radiusKm} km`;

  if (disabled) {
    return (
      <span
        className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-medium text-slate-300 cursor-not-allowed select-none opacity-60"
        title={
          lang === "zh"
            ? "请先输入或选择地址"
            : lang === "ja"
              ? "先に場所を入力してください"
              : "Select location first"
        }
      >
        <Compass size={13} className="shrink-0 text-slate-300" />
        <span className="whitespace-nowrap">{currentLabel}</span>
        <ChevronDown size={11} className="shrink-0 text-slate-300" />
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            isCustom
              ? "bg-purple-50 text-primary font-black hover:bg-purple-100/90"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
          aria-label={`${filterLabel}: ${currentLabel}`}
        >
          <Compass
            size={13}
            className={cn(
              "shrink-0 transition-colors",
              isCustom ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
            )}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">{currentLabel}</span>
          <ChevronDown
            size={11}
            className={cn(
              "shrink-0 transition-transform duration-200",
              isCustom ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
              open ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[200px] rounded-xl border border-slate-200/90 bg-white p-2 shadow-xl backdrop-blur z-30"
      >
        <div className="mb-1.5 border-b border-slate-100 px-1 pb-1.5">
          <div className="text-[11px] font-bold text-slate-800 leading-tight">
            {lang === "zh"
              ? "从地址中心出发的范围"
              : lang === "ja"
                ? "地点中心からの検索範囲"
                : "Radius from location"}
          </div>
          <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
            {lang === "zh"
              ? "筛选该地址周边的照护需求"
              : lang === "ja"
                ? "周辺の照護依頼を絞り込み"
                : "Filter requests in this radius"}
          </div>
        </div>
        <div className="space-y-0.5">
          {options.map((opt) => {
            const isSelected = radiusKm === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition",
                  isSelected
                    ? "bg-purple-50 text-primary font-bold shadow-2xs"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium",
                )}
              >
                <span>{opt.label}</span>
                {isSelected ? <Check size={13} className="text-primary shrink-0 ml-1" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
