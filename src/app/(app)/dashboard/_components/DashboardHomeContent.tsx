"use client";

import Link from "next/link";
import {
  ClipboardList,
  PawPrint,
  Heart,
  ArrowRight,
  Plus,
  Compass,
  Send,
  Briefcase,
  MapPin,
  Coins,
  FileText,
} from "lucide-react";
import {
  PiHandHeart,
  PiHouseLine,
  PiWarehouse,
} from "react-icons/pi";

import { toast } from "sonner";
import { useLanguage } from "@/components/providers/language-provider";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import cn from "@/lib/cn";

export function DashboardHomeContent({
  user,
}: {
  user: { name?: string | null; image?: string | null; email?: string | null };
}) {
  const { t } = useLanguage();
  const copy = t.core.dashboardHome;
  const modes = t.core.modes;
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const utils = trpc.useUtils();

  const summary = trpc.dashboardSummary.getMine.useQuery();
  const data = summary.data;

  const setAccepting = trpc.serviceProfile.setAccepting.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.dashboardSummary.getMine.invalidate(),
        utils.serviceProfile.getSettings.invalidate(),
        utils.serviceProfile.getMine.invalidate(),
      ]);
    },
  });

  const handleToggleAccepting = async () => {
    if (!data?.serviceProfile.exists) return;
    const next = !data.serviceProfile.isAccepting;
    if (!next) {
      const accepted = await confirm({
        title: t.settings.provider.acceptingTitle,
        content: <p>{t.settings.provider.stopQuestion}</p>,
        confirmText: t.settings.provider.stopped,
        variant: "danger",
      });
      if (!accepted) return;
      closeConfirm();
    }
    try {
      await setAccepting.mutateAsync({ active: next });
      toast.success(next ? t.settings.provider.resume : t.settings.provider.stopped);
    } catch {
      toast.error(t.settings.provider.statusError);
    }
  };

  // 1. Published Requests
  const totalPublishedNeeds = data?.totals.needs ?? 0;
  const openNeeds = data?.needStates.OPEN ?? 0;
  const pubNeedVisit = data?.needByMode.HOME_VISIT ?? 0;
  const pubNeedBoarding = data?.needByMode.BOARDING ?? 0;
  const pubNeedCustom = data?.needByMode.CUSTOM ?? 0;

  // 2. Favorited Requests
  const totalFavNeeds = data?.favoritedNeedsCount ?? 0;
  const favNeedVisit = data?.favoritedNeedByMode?.HOME_VISIT ?? 0;
  const favNeedBoarding = data?.favoritedNeedByMode?.BOARDING ?? 0;
  const favNeedCustom = data?.favoritedNeedByMode?.CUSTOM ?? 0;

  // 3. Published Services
  const totalPublishedServices = data?.totals.services ?? 0;
  const activeServices = data?.serviceStates.ACTIVE ?? 0;
  const pubServiceVisit = data?.serviceByMode.HOME_VISIT ?? 0;
  const pubServiceBoarding = data?.serviceByMode.BOARDING ?? 0;
  const pubServiceCustom = data?.serviceByMode.CUSTOM ?? 0;

  // 4. Favorited Services
  const totalFavServices = data?.favoritedServicesCount ?? 0;
  const favServiceVisit = data?.favoritedServiceByMode?.HOME_VISIT ?? 0;
  const favServiceBoarding = data?.favoritedServiceByMode?.BOARDING ?? 0;
  const favServiceCustom = data?.favoritedServiceByMode?.CUSTOM ?? 0;

  const makeBreakdown = (
    visit: number,
    boarding: number,
    custom: number,
    total: number,
  ) => [
    {
      key: "HOME_VISIT" as const,
      label: modes.HOME_VISIT,
      count: visit,
      percent: total > 0 ? Math.round((visit / total) * 100) : 0,
      icon: PiHouseLine,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      barColor: "bg-rose-500",
    },
    {
      key: "BOARDING" as const,
      label: modes.BOARDING,
      count: boarding,
      percent: total > 0 ? Math.round((boarding / total) * 100) : 0,
      icon: PiWarehouse,
      color: "text-teal-600 bg-teal-50 border-teal-100",
      barColor: "bg-teal-500",
    },
    {
      key: "CUSTOM" as const,
      label: modes.CUSTOM,
      count: custom,
      percent: total > 0 ? Math.round((custom / total) * 100) : 0,
      icon: PiHandHeart,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      barColor: "bg-amber-500",
    },
  ];

  const publishedNeedBreakdown = makeBreakdown(pubNeedVisit, pubNeedBoarding, pubNeedCustom, totalPublishedNeeds);
  const favoritedNeedBreakdown = makeBreakdown(favNeedVisit, favNeedBoarding, favNeedCustom, totalFavNeeds);
  const publishedServiceBreakdown = makeBreakdown(pubServiceVisit, pubServiceBoarding, pubServiceCustom, totalPublishedServices);
  const favoritedServiceBreakdown = makeBreakdown(favServiceVisit, favServiceBoarding, favServiceCustom, totalFavServices);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden space-y-4">
      {/* Top Fixed Header: Well-balanced Lightweight Header */}
      <div className="shrink-0 px-2 pt-2.5 pb-4 border-b border-slate-200/70">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
          {copy.welcome}
          <span className="font-black text-primary ml-2 truncate">
            {user.name ?? copy.guest}
          </span>
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">
          {copy.description}
        </p>
      </div>

      {/* Lower Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-1 pb-8 space-y-6 pt-2">
        {/* ========================================================================= */}
        {/* Section 1: 需求 (Requests) */}
        {/* ========================================================================= */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-primary">
              <ClipboardList size={13} />
            </span>
            <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">
              {copy.requestsModule}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1.1 我发布的需求 (My Published Requests) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-purple-200">
              <div>
                <div className="flex items-center justify-between min-h-[24px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-primary">
                      <Send size={12} className="translate-x-[0.5px]" />
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {copy.myPublishedNeeds}
                    </span>
                  </div>
                  {totalPublishedNeeds > 0 ? (
                    <Link
                      href="/dashboard/needs"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{copy.viewAllNeeds}</span>
                      <ArrowRight size={12} />
                    </Link>
                  ) : null}
                </div>

                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400">{copy.total}</span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {totalPublishedNeeds}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {copy.publishedNeeds}
                  </span>
                  {totalPublishedNeeds > 0 && openNeeds > 0 ? (
                    <>
                      <span className="text-slate-300 font-bold">·</span>
                      <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {openNeeds} {copy.activeNeeds}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* 分类统计 / 空状态 */}
              <div className="min-h-[76px] flex flex-col justify-center">
                {totalPublishedNeeds === 0 ? (
                  <div className="h-[76px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-400 font-medium">{copy.noNeeds}</p>
                    <Link
                      href="/needs/create"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Plus size={12} />
                      <span>{t.core.dashboardNeeds.create}</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {publishedNeedBreakdown.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className={cn(
                            "rounded-xl border p-2.5 space-y-1.5 transition-colors",
                            item.count > 0
                              ? "bg-slate-50/90 border-slate-100/90 hover:bg-slate-100/70"
                              : "bg-slate-50/40 border-slate-100/50 opacity-65",
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                item.color,
                              )}
                            >
                              <ItemIcon size={12} />
                            </span>
                            <span className="text-xs font-black text-slate-900 tabular-nums">
                              {item.count}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {item.label}
                          </p>
                          <div className="w-full bg-slate-200/50 rounded-full h-1 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                item.count > 0 ? item.barColor : "bg-transparent",
                              )}
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 1.2 我收藏的需求 (My Favorited Requests) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-rose-200">
              <div>
                <div className="flex items-center justify-between min-h-[24px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                      <Heart size={12} fill="currentColor" />
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {copy.myFavoritedNeeds}
                    </span>
                  </div>
                  {totalFavNeeds > 0 ? (
                    <Link
                      href="/dashboard/favorites"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{copy.viewFavorites}</span>
                      <ArrowRight size={12} />
                    </Link>
                  ) : null}
                </div>

                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400">{copy.total}</span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {totalFavNeeds}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {copy.favoritedNeeds}
                  </span>
                </div>
              </div>

              {/* 分类统计 / 空状态 */}
              <div className="min-h-[76px] flex flex-col justify-center">
                {totalFavNeeds === 0 ? (
                  <div className="h-[76px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-400 font-medium">{copy.noFavoritedNeeds}</p>
                    <Link
                      href="/needs"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Compass size={12} />
                      <span>{copy.exploreRequests}</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {favoritedNeedBreakdown.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className={cn(
                            "rounded-xl border p-2.5 space-y-1.5 transition-colors",
                            item.count > 0
                              ? "bg-slate-50/90 border-slate-100/90 hover:bg-slate-100/70"
                              : "bg-slate-50/40 border-slate-100/50 opacity-65",
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                item.color,
                              )}
                            >
                              <ItemIcon size={12} />
                            </span>
                            <span className="text-xs font-black text-slate-900 tabular-nums">
                              {item.count}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {item.label}
                          </p>
                          <div className="w-full bg-slate-200/50 rounded-full h-1 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                item.count > 0 ? item.barColor : "bg-transparent",
                              )}
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* Section 2: 服务 (Services) */}
        {/* ========================================================================= */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-primary">
              <PawPrint size={13} />
            </span>
            <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">
              {copy.servicesModule}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 2.1 我发布的服务 (My Published Services) - 整合服务档案控制与信息 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3.5 transition-all duration-200 hover:border-purple-200">
              <div className="space-y-3">
                {/* 头部：标题与接单开关 */}
                <div className="flex items-center justify-between min-h-[24px] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-primary">
                      <Briefcase size={12} />
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {copy.myPublishedServices}
                    </span>
                  </div>

                  {data?.serviceProfile.exists ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            data.serviceProfile.isAccepting
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-amber-500",
                          )}
                        />
                        <span
                          className={
                            data.serviceProfile.isAccepting
                              ? "text-emerald-700 font-bold"
                              : "text-amber-700 font-bold"
                          }
                        >
                          {data.serviceProfile.isAccepting ? copy.accepting : copy.notAccepting}
                        </span>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={data.serviceProfile.isAccepting}
                        disabled={setAccepting.isLoading}
                        onClick={handleToggleAccepting}
                        className={cn(
                          "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          data.serviceProfile.isAccepting ? "bg-primary" : "bg-slate-300",
                          setAccepting.isLoading && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            data.serviceProfile.isAccepting ? "translate-x-3.5" : "translate-x-0",
                          )}
                        />
                      </button>

                      {totalPublishedServices > 0 ? (
                        <Link
                          href="/dashboard/serviceprofile"
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 ml-1"
                        >
                          <span>{copy.viewAllServices}</span>
                          <ArrowRight size={12} />
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <Link
                      href="/dashboard/serviceprofile"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{t.core.serviceProfileEntry.action}</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </div>

                {/* 数据统计指标行 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400">{copy.total}</span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {totalPublishedServices}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {copy.publishedServices}
                  </span>
                  {totalPublishedServices > 0 && activeServices > 0 ? (
                    <>
                      <span className="text-slate-300 font-bold">·</span>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {activeServices} {copy.activeServices}
                      </span>
                    </>
                  ) : null}
                </div>

                {/* 服务档案微型摘要信息条：基础地址、货币、自我介绍 */}
                {data?.serviceProfile.exists ? (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs rounded-xl bg-slate-50/90 border border-slate-100/90 px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      <MapPin size={11} className="text-teal-600 shrink-0" />
                      <span className="truncate max-w-[110px]" title={data.serviceProfile.locationLabel ?? copy.notSet}>
                        {data.serviceProfile.locationLabel ?? copy.notSet}
                      </span>
                    </span>
                    <span className="text-slate-300">·</span>
                    {data.serviceProfile.baseCurrency ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                          <Coins size={11} className="text-amber-600 shrink-0" />
                          <span>{data.serviceProfile.baseCurrency}</span>
                        </span>
                        <span className="text-slate-300">·</span>
                      </>
                    ) : null}
                    {data.serviceProfile.introduction ? (
                      <span
                        className="inline-flex items-center gap-1 text-slate-600 font-medium truncate max-w-[140px]"
                        title={data.serviceProfile.introduction}
                      >
                        <FileText size={11} className="text-purple-600 shrink-0" />
                        <span className="truncate">{data.serviceProfile.introduction}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">{copy.profileIntro}: {copy.notSet}</span>
                    )}
                    <Link
                      href="/dashboard/serviceprofile"
                      className="text-[11px] font-bold text-primary hover:underline ml-auto"
                    >
                      {copy.manageProfile} →
                    </Link>
                  </div>
                ) : null}
              </div>

              {/* 分类统计 / 空状态 */}
              <div className="min-h-[76px] flex flex-col justify-center">
                {totalPublishedServices === 0 ? (
                  <div className="h-[76px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-400 font-medium">{copy.noServices}</p>
                    <Link
                      href="/dashboard/serviceprofile"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Plus size={12} />
                      <span>{copy.createService}</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {publishedServiceBreakdown.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className={cn(
                            "rounded-xl border p-2.5 space-y-1.5 transition-colors",
                            item.count > 0
                              ? "bg-slate-50/90 border-slate-100/90 hover:bg-slate-100/70"
                              : "bg-slate-50/40 border-slate-100/50 opacity-65",
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                item.color,
                              )}
                            >
                              <ItemIcon size={12} />
                            </span>
                            <span className="text-xs font-black text-slate-900 tabular-nums">
                              {item.count}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {item.label}
                          </p>
                          <div className="w-full bg-slate-200/50 rounded-full h-1 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                item.count > 0 ? item.barColor : "bg-transparent",
                              )}
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2.2 我收藏的服务 (My Favorited Services) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-rose-200">
              <div>
                <div className="flex items-center justify-between min-h-[24px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                      <Heart size={12} fill="currentColor" />
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {copy.myFavoritedServices}
                    </span>
                  </div>
                  {totalFavServices > 0 ? (
                    <Link
                      href="/dashboard/favorites"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{copy.viewFavorites}</span>
                      <ArrowRight size={12} />
                    </Link>
                  ) : null}
                </div>

                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400">{copy.total}</span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {totalFavServices}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {copy.favoritedServices}
                  </span>
                </div>
              </div>

              {/* 分类统计 / 空状态 */}
              <div className="min-h-[76px] flex flex-col justify-center">
                  {totalFavServices === 0 ? (
                    <div className="h-[76px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3 flex flex-col items-center justify-center text-center">
                      <p className="text-xs text-slate-400 font-medium">{copy.noFavoritedServices}</p>
                      <Link
                        href="/services"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <Compass size={12} />
                        <span>{copy.exploreServices}</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {favoritedServiceBreakdown.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <div
                            key={item.key}
                            className={cn(
                              "rounded-xl border p-2.5 space-y-1.5 transition-colors",
                              item.count > 0
                                ? "bg-slate-50/90 border-slate-100/90 hover:bg-slate-100/70"
                                : "bg-slate-50/40 border-slate-100/50 opacity-65",
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                  item.color,
                                )}
                              >
                                <ItemIcon size={12} />
                              </span>
                              <span className="text-xs font-black text-slate-900 tabular-nums">
                                {item.count}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 truncate">
                              {item.label}
                            </p>
                            <div className="w-full bg-slate-200/50 rounded-full h-1 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  item.count > 0 ? item.barColor : "bg-transparent",
                                )}
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
