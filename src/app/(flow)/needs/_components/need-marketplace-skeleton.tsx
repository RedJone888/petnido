"use client";

import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { NeedCardSkeleton } from "./need-card";

const DEFAULT_SPLIT_PERCENT = 60;
const MIN_SPLIT_PERCENT = 42;
const MAX_SPLIT_PERCENT = 75;
const SPLIT_STORAGE_KEY = "petnido_needs_split_ratio";

export function NeedMarketplaceSkeleton() {
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SPLIT_STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= MIN_SPLIT_PERCENT && parsed <= MAX_SPLIT_PERCENT) {
          setSplitPercent(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <main
      style={{ "--split-percent": `${splitPercent}%` } as React.CSSProperties}
      className="relative h-[calc(100dvh-64px)] w-full overflow-hidden bg-[#f8f6f9]"
    >
      <div className="flex h-full w-full">
        {/* LEFT COLUMN: Header + Filters + Need Cards Skeleton */}
        <div className="flex h-full w-full flex-col overflow-hidden bg-[#f8f6f9] xl:w-[var(--split-percent,60%)] xl:shrink-0">
          {/* Header Skeleton */}
          <div className="shrink-0 px-5 pb-2 pt-4">
            {/* Breadcrumb Skeleton */}
            <div className="mb-2.5 flex items-center gap-2">
              <div className="h-3.5 w-12 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-3 rounded bg-slate-200 animate-pulse" />
              <div className="h-3.5 w-16 rounded bg-slate-200 animate-pulse" />
            </div>

            {/* Filter Bar Skeleton */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Location input skeleton */}
                <div className="h-9 min-w-[200px] flex-1 rounded-full border border-slate-200/80 bg-white shadow-sm animate-pulse" />
                {/* Filter pills */}
                <div className="h-9 w-24 rounded-full border border-slate-200/80 bg-white shadow-sm animate-pulse" />
                <div className="h-9 w-24 rounded-full border border-slate-200/80 bg-white shadow-sm animate-pulse" />
                <div className="h-9 w-28 rounded-full border border-slate-200/80 bg-white shadow-sm animate-pulse" />
              </div>

              {/* Title & Count Row Skeleton */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-36 rounded-lg bg-slate-200 animate-pulse" />
                  <div className="h-5 w-14 rounded-full bg-slate-200 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Cards Content Area Skeleton */}
          <div className="flex-1 overflow-hidden px-3.5 py-3 sm:px-5 sm:py-4">
            <section
              className="flex gap-3 sm:gap-3.5 items-start"
              aria-label="Loading marketplace..."
            >
              {[1, 2, 3].map((colIdx) => (
                <div
                  key={colIdx}
                  className="flex flex-1 flex-col gap-3 sm:gap-3.5 min-w-0 max-w-[280px]"
                >
                  <NeedCardSkeleton key={1} />
                  <NeedCardSkeleton key={2} />
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* RESIZABLE SPLIT DIVIDER SKELETON (Desktop Only) */}
        <div
          aria-hidden="true"
          className="relative hidden h-full w-2.5 shrink-0 items-center justify-center xl:flex z-20 select-none"
        >
          <div className="h-full w-[1px] bg-slate-200/90" />
          <div className="absolute top-1/2 -translate-y-1/2 flex h-8 w-3.5 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-300">
            <GripVertical size={12} strokeWidth={2.5} />
          </div>
        </div>

        {/* RIGHT COLUMN: Map Area Skeleton (Desktop Only) */}
        <aside
          aria-hidden="true"
          className="hidden xl:block h-full flex-1 overflow-hidden p-3 pl-1 xl:p-3.5 xl:pl-1 2xl:p-4 2xl:pl-1.5"
        >
          <div className="relative h-full w-full overflow-hidden rounded-2xl 2xl:rounded-3xl border border-slate-200/80 bg-slate-100/90 shadow-sm ring-1 ring-slate-900/[0.04]">
            {/* Subtle Map Grid Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

            {/* Simulated Animated Map Marker Pins */}
            <div className="absolute top-[28%] left-[35%] flex items-center justify-center">
              <div className="h-7 w-7 rounded-full bg-primary/20 border-2 border-white shadow-md animate-pulse" />
            </div>
            <div className="absolute top-[52%] left-[62%] flex items-center justify-center">
              <div className="h-7 w-7 rounded-full bg-emerald-500/20 border-2 border-white shadow-md animate-pulse" />
            </div>
            <div className="absolute top-[68%] left-[42%] flex items-center justify-center">
              <div className="h-7 w-7 rounded-full bg-violet-500/20 border-2 border-white shadow-md animate-pulse" />
            </div>

            {/* Top-Left Map Navigation Controls Skeleton (Zoom in/out, Compass & Locate Button) */}
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-sm space-y-1">
                <div className="h-6 w-6 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-6 w-6 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-6 w-6 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="h-8 w-8 rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-sm flex items-center justify-center">
                <div className="h-5 w-5 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>

            {/* Bottom-Right Map Theme Layer Switcher Skeleton (Standard, Detailed, Simple, Mono, Satellite) */}
            <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-md backdrop-blur-md">
              <div className="h-7 w-12 rounded-xl bg-primary/20 animate-pulse" />
              <div className="h-7 w-12 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-7 w-12 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-7 w-12 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-7 w-12 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
