"use client";

import Link from "next/link";
import { User } from "lucide-react";
import type { ElementType, ReactNode } from "react";

import cn from "@/lib/cn";
import { AppImage } from "@/components/ui/app-image";

export type DashboardNeedCardStatusTheme = {
  container: string;
  dot: string;
};

export function DashboardNeedCardFrame({ children }: { children: ReactNode }) {
  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs">
      {children}
    </article>
  );
}

export function DashboardNeedCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs animate-pulse"
    >
      <div className="block min-w-0">
        {/* Cover Skeleton */}
        <div className="relative h-[135px] w-full bg-slate-200">
          <div className="absolute left-2 top-2 h-5 w-16 rounded-full bg-slate-300/80" />
          <div className="absolute right-2 top-2 h-5 w-14 rounded-full bg-slate-300/80" />
        </div>

        {/* Body Skeleton */}
        <div className="flex flex-col gap-2.5 p-3.5">
          <div>
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="h-4 w-36 rounded bg-slate-200" />
              <div className="h-4 w-12 rounded bg-slate-200" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full bg-slate-200" />
                <div className="h-3 w-20 rounded bg-slate-200" />
              </div>
              <div className="h-3 w-16 rounded bg-slate-200" />
            </div>
          </div>

          {/* Info Rows Skeleton */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-slate-200" />
              <div className="h-3 w-28 rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-slate-200" />
              <div className="h-3 w-40 rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="px-3.5 pb-3.5">
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
          <div className="h-7 flex-1 rounded-lg bg-slate-200" />
          <div className="h-7 w-7 shrink-0 rounded-lg bg-slate-200" />
        </div>
      </div>
    </article>
  );
}

export function DashboardNeedsSkeleton() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden space-y-4 animate-pulse">
      {/* 1. TOP HEADER Skeleton */}
      <div className="h-auto shrink-0 space-y-3 border-b border-slate-200/70 px-2 py-3 md:flex md:h-[var(--dashboard-title-height)] md:flex-col md:justify-center md:py-0">
        {/* Title */}
        <div className="h-7 w-32 rounded-lg bg-slate-200" />

        {/* Filter Pills & Add Button */}
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="h-6 w-14 rounded-full bg-slate-200" />
            <div className="h-6 w-14 rounded-full bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="h-6 w-14 rounded-full bg-slate-200" />
          </div>

          <div className="shrink-0">
            <div className="h-8 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      {/* 2. LOWER CONTENT AREA Skeleton */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-8 pr-1 pt-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <DashboardNeedCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

import { petAvatarPosition } from "@/domain/pet/avatar";
export { petAvatarPosition };

export function DashboardNeedCard({
  href,
  coverImage,
  fallbackPetType,
  fallbackPetLabel,
  modeIcon: ModeIcon,
  modeLabel,
  modeTheme,
  statusLabel,
  statusTheme,
  title,
  budgetLabel,
  openBudget,
  owner,
  publishedLabel,
  publishedAt,
  locale,
  location,
  schedule,
  pets,
  footer,
}: {
  href: string;
  coverImage: string | null | undefined;
  fallbackPetType: string;
  fallbackPetLabel: string;
  modeIcon: ElementType;
  modeLabel: string;
  modeTheme: string;
  statusLabel: string;
  statusTheme: DashboardNeedCardStatusTheme;
  title: string;
  budgetLabel: string;
  openBudget: boolean;
  owner: { name: string; image?: string | null };
  publishedLabel: string;
  publishedAt: Date | string;
  locale: string;
  location: ReactNode;
  schedule: ReactNode;
  pets?: ReactNode;
  footer?: ReactNode;
}) {
  const publishedDate = new Date(publishedAt);

  return (
    <DashboardNeedCardFrame>
      <Link href={href} className="block min-w-0">
        <div className="relative overflow-hidden">
          <div className="relative h-[135px] w-full overflow-hidden bg-[#fff8e8]">
            {coverImage ? (
              <AppImage src={coverImage} alt={title} width={480} height={320} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            ) : (
              <span role="img" aria-label={fallbackPetLabel} className="block h-full w-full bg-[#fff8e8] bg-no-repeat transition duration-300 group-hover:scale-[1.03]" style={{ backgroundImage: "url('/images/pet-default-avatars-v2.png')", backgroundPosition: petAvatarPosition(fallbackPetType), backgroundSize: "400% auto" }} />
            )}
          </div>
          <div className={cn("absolute left-2 top-2 inline-flex max-w-[calc(100%-7.5rem)] items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs backdrop-blur-md", modeTheme)}>
            <ModeIcon size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{modeLabel}</span>
          </div>
          <div className={cn("absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs", statusTheme.container)}>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusTheme.dot)} />
            <span>{statusLabel}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-3.5">
          <div>
            <div className="flex min-w-0 items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 truncate text-[14px] font-black text-slate-900 transition group-hover:text-primary" title={title}>{title}</h3>
              <span className={openBudget ? "shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500" : "shrink-0 text-[12.5px] font-black tracking-tight text-primary tabular-nums"}>{budgetLabel}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-purple-100 bg-purple-50 text-primary">
                  {owner.image ? <AppImage src={owner.image} alt={owner.name} width={28} height={28} className="h-full w-full object-cover" /> : <User size={13} />}
                </div>
                <span className="min-w-0 truncate text-[11px] font-semibold text-slate-700">{owner.name}</span>
              </div>
              <time dateTime={publishedDate.toISOString()} className="shrink-0 text-[10.5px] text-slate-400">{publishedLabel}{publishedDate.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}</time>
            </div>
          </div>
          <div className="space-y-1.5 text-[11.5px] font-medium text-slate-600">
            {location}
            {schedule}
            {pets}
          </div>
        </div>
      </Link>

      {footer ? <div className="px-3.5 pb-3.5"><div className="border-t border-slate-100 pt-2.5">{footer}</div></div> : null}
    </DashboardNeedCardFrame>
  );
}
