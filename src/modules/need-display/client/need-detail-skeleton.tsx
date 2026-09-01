import React from "react";

export function NeedDetailSkeleton() {
  return (
    <main className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-[#FAF8F5] text-[#2B231D] font-sans antialiased lg:flex-row px-4 sm:px-6 lg:px-8 py-5 lg:py-6 gap-8 lg:gap-16 xl:gap-28 2xl:gap-36">
      {/* ================= LEFT COLUMN: Fixed Header on top + Scrollable Body below ================= */}
      <div className="flex flex-1 min-w-0 flex-col h-full overflow-hidden animate-pulse">
        {/* Fixed Top Header (Non-scrolling): Breadcrumbs, Title, Status, Meta Line */}
        <div className="shrink-0 px-0 pt-0 pb-3 space-y-3 bg-[#FAF8F5] border-b border-[#EDE8E1]/60">
          {/* 1. Breadcrumb skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-12 rounded bg-[#E8E2D8]" />
            <div className="h-3 w-3 rounded bg-[#EDE8E1]" />
            <div className="h-3.5 w-16 rounded bg-[#E8E2D8]" />
            <div className="h-3 w-3 rounded bg-[#EDE8E1]" />
            <div className="h-3.5 w-32 rounded bg-[#E2DDD5]" />
          </div>

          {/* 2. Main Title with Mode Pill & Status Pill */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="h-7 sm:h-8 w-64 sm:w-80 rounded-xl bg-[#E2DDD5]" />
            <div className="h-6 w-24 rounded-full bg-[#E5DDF0]" />
            <div className="h-6 w-20 rounded-full bg-[#E2ECE5]" />
          </div>

          {/* 3. Meta line (Location, Date Range, Publish Date) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-[#EAE5DC]" />
              <div className="h-4 w-28 rounded bg-[#E2DDD5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-[#EAE5DC]" />
              <div className="h-4 w-44 rounded bg-[#E2DDD5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-[#EAE5DC]" />
              <div className="h-4 w-24 rounded bg-[#EFEBE4]" />
            </div>
          </div>
        </div>

        {/* Scrollable Left Column Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pt-3 pb-8">
          {/* Section 1: 📖 需求概述 (About this request / Story) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-[#E5DDF0]" />
              <div className="h-5 w-24 rounded-lg bg-[#E2DDD5]" />
            </div>
            <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5 sm:p-6 shadow-2xs space-y-2.5">
              <div className="h-4 w-full rounded bg-[#EFEBE4]" />
              <div className="h-4 w-11/12 rounded bg-[#EFEBE4]" />
              <div className="h-4 w-4/5 rounded bg-[#EFEBE4]" />
              <div className="h-4 w-3/5 rounded bg-[#EFEBE4]" />
            </div>
          </section>

          {/* Section 2: 🐾 需要照顾的宠物 (Pets to care for) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-[#E5DDF0]" />
              <div className="h-5 w-32 rounded-lg bg-[#E2DDD5]" />
              <div className="h-4 w-14 rounded-full bg-[#EAE5DC]" />
            </div>

            <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5 sm:p-6 shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#EDE8E1]">
                {[1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`space-y-3 ${idx === 1 ? "md:pr-6 pb-4 md:pb-0" : "pt-4 md:pt-0 md:pl-6"}`}
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div className="h-15 w-15 sm:h-16 sm:w-16 rounded-2xl bg-[#EDE8E1] shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-20 rounded bg-[#E2DDD5]" />
                          <div className="h-4 w-14 rounded-full bg-[#E5DDF0]" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <div className="h-4 w-14 rounded bg-[#F2EFE9]" />
                          <div className="h-4 w-16 rounded bg-[#F2EFE9]" />
                          <div className="h-4 w-14 rounded bg-[#F2EFE9]" />
                        </div>
                      </div>
                    </div>
                    <div className="h-9 w-full rounded-xl bg-[#FAF6F0] border border-[#EFE7DC]/60" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: 📅 照护日程与任务 (Care Schedule & Tasks) */}
          <section className="space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-[#E5DDF0]" />
              <div className="h-5 w-36 rounded-lg bg-[#E2DDD5]" />
            </div>

            {/* Macro schedule stats ribbon */}
            <div className="rounded-2xl border border-[#EDE8E1] bg-white p-4 sm:p-4.5 shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EDE8E1]">
                {[1, 2, 3, 4].map((statIdx) => (
                  <div key={statIdx} className={`space-y-1.5 ${statIdx > 1 ? "sm:pl-4" : ""} ${statIdx > 2 ? "pt-3 sm:pt-0" : ""}`}>
                    <div className="h-3 w-16 rounded bg-[#EFEBE4]" />
                    <div className="h-5 w-20 rounded-lg bg-[#E2DDD5]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Visit cards stack */}
            <div className="space-y-3">
              {/* Visit 1: Expanded Card */}
              <div className="rounded-2xl border border-primary/25 bg-primary/[0.02] shadow-2xs overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-[#EDE8E1]/80">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-16 rounded-lg bg-primary/20" />
                    <div className="h-5 w-28 rounded-lg bg-[#E2DDD5]" />
                    <div className="h-5 w-20 rounded-full bg-[#EAE5DC]" />
                  </div>
                  <div className="h-4 w-4 rounded-full bg-[#EDE8E1]" />
                </div>
                <div className="p-4 space-y-3 bg-white/70">
                  {[1, 2].map((taskIdx) => (
                    <div key={taskIdx} className="flex gap-3 py-2 border-b border-[#F2EFE9] last:border-0 items-center">
                      <div className="h-10 w-10 rounded-xl bg-[#EDE8E1] shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-32 rounded bg-[#E2DDD5]" />
                        <div className="h-3 w-48 rounded bg-[#F0ECE6]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visit 2 & 3: Collapsed Cards */}
              {[2, 3].map((visitIdx) => (
                <div
                  key={visitIdx}
                  className="rounded-2xl border border-[#EDE8E1] bg-white p-4 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-16 rounded-lg bg-[#EAE5DC]" />
                    <div className="h-5 w-28 rounded-lg bg-[#E2DDD5]" />
                    <div className="h-5 w-20 rounded-full bg-[#F2EFE9]" />
                  </div>
                  <div className="h-4 w-4 rounded-full bg-[#EDE8E1]" />
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: ⚠️ 特殊要求与注意事项 (Requirements) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-[#E5DDF0]" />
              <div className="h-5 w-36 rounded-lg bg-[#E2DDD5]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[1, 2].map((reqIdx) => (
                <div
                  key={reqIdx}
                  className="flex items-center gap-2.5 rounded-2xl border border-[#EDE8E1] bg-white p-3.5 shadow-2xs"
                >
                  <div className="h-4 w-4 rounded-full bg-[#E2ECE5]" />
                  <div className="h-3.5 w-36 rounded bg-[#E2DDD5]" />
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: 📍 服务地点 (Service Location) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-[#E5DDF0]" />
              <div className="h-5 w-24 rounded-lg bg-[#E2DDD5]" />
            </div>
            <div className="rounded-2xl border border-[#EDE8E1] bg-white p-4 shadow-2xs">
              <div className="h-60 w-full rounded-xl bg-[#EDE8E1] relative overflow-hidden" />
            </div>
          </section>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: Fixed Unified Card ================= */}
      <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[350px] lg:shrink-0 px-0 py-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
        <div className="rounded-3xl border border-[#EDE8E1] bg-white p-4 sm:p-5 shadow-sm space-y-4 animate-pulse">
          {/* 1. Month Calendar Skeleton */}
          <div className="space-y-2.5">
            {/* Month nav header */}
            <div className="flex items-center justify-between pb-1">
              <div className="h-7 w-7 rounded-lg bg-[#F2EFE9]" />
              <div className="h-4 w-24 rounded-lg bg-[#E2DDD5]" />
              <div className="h-7 w-7 rounded-lg bg-[#F2EFE9]" />
            </div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 pb-0.5">
              {[1, 2, 3, 4, 5, 6, 7].map((w) => (
                <div key={w} className="h-3 w-4 mx-auto rounded bg-[#EFEBE4]" />
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, dIdx) => (
                <div
                  key={dIdx}
                  className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center ${
                    [3, 5, 8, 12, 15].includes(dIdx)
                      ? "border-2 border-primary/40 bg-purple-50/50"
                      : "bg-transparent"
                  }`}
                >
                  <div className="h-3.5 w-3.5 rounded-full bg-[#EAE5DC]" />
                </div>
              ))}
            </div>
            {/* Legend indicator */}
            <div className="flex items-center gap-2 pt-1">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-primary/40 bg-white" />
              <div className="h-3.5 w-16 rounded bg-[#EFEBE4]" />
            </div>
          </div>

          {/* 2. Amount & Breakdown Section Skeleton */}
          <div className="pt-3 border-t border-[#F2EFE9] space-y-3">
            {/* Big Price Display */}
            <div>
              <div className="flex items-baseline gap-2">
                <div className="h-8 w-32 rounded-xl bg-primary/20" />
                <div className="h-4 w-14 rounded bg-[#EFEBE4]" />
              </div>
              {/* Formula subline */}
              <div className="mt-1.5 h-3.5 w-44 rounded bg-[#EFEBE4]" />
            </div>

            {/* Rate breakdown items */}
            <div className="space-y-2 pt-1">
              {[1, 2, 3].map((rowIdx) => (
                <div key={rowIdx} className="flex justify-between items-center">
                  <div className="h-3.5 w-20 rounded bg-[#EFEBE4]" />
                  <div className="h-4 w-14 rounded bg-[#E2DDD5]" />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Action Buttons Skeleton */}
          <div className="space-y-2.5 pt-2 border-t border-[#F2EFE9]">
            <div className="h-11 w-full rounded-xl bg-primary/30" />
            <div className="h-11 w-full rounded-xl bg-[#FAF8F5] border border-[#EDE8E1]" />
          </div>

          {/* 4. Owner Info Section Skeleton */}
          <div className="pt-3.5 border-t border-[#F2EFE9] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 rounded-full bg-[#E5DDF0] shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-4 w-20 rounded bg-[#E2DDD5]" />
                <div className="h-3 w-14 rounded bg-[#EFEBE4]" />
              </div>
            </div>
            <div className="h-7 w-20 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1]" />
          </div>
        </div>
      </aside>
    </main>
  );
}
