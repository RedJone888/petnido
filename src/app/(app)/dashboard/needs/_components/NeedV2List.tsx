"use client";

import {
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PiCalendarBlank,
  PiHandHeart,
  PiHouseLine,
  PiMapPinLine,
  PiPawPrint,
  PiSpinner,
  PiWarehouse,
} from "react-icons/pi";

import cn from "@/lib/cn";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { mapNeedDraftPayloadToLegacyNeedDraftV3 } from "@/domain/publishing/legacy-need-draft-v3";
import { NEED_DRAFT_STORAGE_KEY } from "@/app/(flow)/needs/create/preview/types";
import { LegacyCompatibilityPanel } from "@/components/publishing/legacy-compatibility-panel";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import EmptyState from "../../_components/EmptyState";
import {
  NEED_DISPLAY_CONFIG,
  type NeedDisplayStatus,
} from "@/domain/need/constant";
import {
  compactDate,
  formatPetsSummary,
  NeedLocationLabel,
} from "@/app/(flow)/needs/_components/need-card";
import {
  calculateBoardingNights,
  calculateNeedPricing,
  calculateTotalHomeVisits,
  formatNeedEstimatedBadge,
  inclusiveDayCount,
  type NeedPricingInput,
} from "@/domain/marketplace/need-pricing";
import { messages } from "@/i18n/messages";

function petAvatarPosition(petType: string) {
  const normalized = petType.trim().toUpperCase();
  if (normalized === "DOG") return "0% 0%";
  if (normalized === "CAT") return "33.333% 0%";
  if (normalized === "RABBIT") return "66.667% 0%";
  if (normalized === "BIRD") return "100% 0%";
  if (normalized === "HAMSTER") return "0% 50%";
  if (normalized === "GUINEA_PIG") return "33.333% 50%";
  if (normalized === "CHINCHILLA") return "0% 100%";
  return "33.333% 100%";
}

function formatNeedPetTitle(
  pets: Array<{ name?: string | null; petType: string; quantity?: number }>,
  lang: string,
  t: (typeof messages)[keyof typeof messages],
): string {
  if (!pets || pets.length === 0) {
    return lang === "zh" ? "宠物" : lang === "ja" ? "ペット" : "Pet";
  }

  const namedPets = pets.filter((p) => p.name && p.name.trim().length > 0);
  if (namedPets.length > 0) {
    const names = namedPets.map((p) => p.name!.trim());
    if (names.length === 1) {
      const otherCount =
        pets.reduce((sum, p) => sum + (p.quantity || 1), 0) -
        (namedPets[0].quantity || 1);
      if (otherCount > 0) {
        return lang === "zh"
          ? `${names[0]} 等 ${otherCount + 1} 只宠物`
          : lang === "ja"
            ? `${names[0]} 他${otherCount + 1}匹`
            : `${names[0]} & ${otherCount} more`;
      }
      return names[0];
    }
    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }
    if (names.length === 3) {
      return lang === "zh"
        ? `${names[0]}、${names[1]} & ${names[2]}`
        : `${names[0]}, ${names[1]} & ${names[2]}`;
    }
    return lang === "zh"
      ? `${names[0]}、${names[1]} 等 ${pets.length} 只宠物`
      : `${names[0]}, ${names[1]} & ${pets.length - 2} more`;
  }

  const typeMap: Record<string, number> = {};
  for (const p of pets) {
    const typeKey = (p.petType || "OTHER").trim().toUpperCase();
    const qty = p.quantity || 1;
    typeMap[typeKey] = (typeMap[typeKey] || 0) + qty;
  }
  const parts = Object.entries(typeMap).map(([typeKey, count]) => {
    const label = t.core.pets[typeKey as keyof typeof t.core.pets] || typeKey;
    if (lang === "zh") return count > 1 ? `${count}只${label}` : label;
    if (lang === "ja") return count > 1 ? `${count}匹の${label}` : label;
    return count > 1 ? `${count} ${label}s` : label;
  });

  return parts.join(" & ") || (lang === "zh" ? "宠物" : lang === "ja" ? "ペット" : "Pet");
}

type VisibleNeedFilter = "ALL" | "OPEN" | "EXPIRED" | "MATCHED" | "CLOSED";
const VISIBLE_STATUS_KEYS: VisibleNeedFilter[] = [
  "ALL",
  "OPEN",
  "EXPIRED",
  "MATCHED",
  "CLOSED",
];

const requestModeIcons: Record<string, ElementType> = {
  HOME_VISIT: PiHouseLine,
  BOARDING: PiWarehouse,
  CUSTOM: PiHandHeart,
};

const modeBadgeThemes: Record<string, string> = {
  HOME_VISIT: "bg-emerald-600 text-white shadow-emerald-950/20",
  BOARDING: "bg-amber-600 text-white shadow-amber-950/20",
  CUSTOM: "bg-violet-600 text-white shadow-violet-950/20",
};

const statusBadgeThemes: Record<
  string,
  { container: string; dot: string }
> = {
  OPEN: {
    container:
      "bg-white/95 text-emerald-800 border border-emerald-300/90 shadow-sm backdrop-blur-md",
    dot: "bg-emerald-500 ring-2 ring-emerald-200",
  },
  EXPIRED: {
    container:
      "bg-white/95 text-amber-900 border border-amber-300/90 shadow-sm backdrop-blur-md",
    dot: "bg-amber-500 ring-2 ring-amber-200",
  },
  MATCHED: {
    container:
      "bg-white/95 text-purple-900 border border-purple-300/90 shadow-sm backdrop-blur-md",
    dot: "bg-purple-500 ring-2 ring-purple-200",
  },
  CLOSED: {
    container:
      "bg-slate-900/80 text-slate-100 border border-slate-700 shadow-sm backdrop-blur-md",
    dot: "bg-slate-400",
  },
  CANCELLED: {
    container:
      "bg-white/95 text-rose-800 border border-rose-300/90 shadow-sm backdrop-blur-md",
    dot: "bg-rose-500 ring-2 ring-rose-200",
  },
};

function getNeedDisplayStatus(need: {
  state: string;
  expired?: boolean;
  endsAt?: string | Date;
}): NeedDisplayStatus {
  const isExpired =
    need.state === "OPEN" &&
    (need.expired ??
      (need.endsAt ? new Date(need.endsAt) <= new Date() : false));
  if (isExpired) return "EXPIRED";
  if (need.state === "OPEN") return "OPEN";
  if (need.state === "MATCHED") return "MATCHED";
  if (need.state === "CLOSED") return "CLOSED";
  if (need.state === "CANCELLED") return "CANCELLED";
  return (need.state as NeedDisplayStatus) ?? "OPEN";
}

export function NeedV2List({
  user,
  mutable,
}: {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  mutable: boolean;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const confirm = useConfirm();
  const utils = trpc.useUtils();
  const needs = trpc.needV2.listMine.useQuery();
  const command = trpc.needV2.executeCommand.useMutation({
    onMutate: async (variables) => {
      await utils.needV2.listMine.cancel();
      const previousData = utils.needV2.listMine.getData();
      utils.needV2.listMine.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((item) => {
          if (item.id !== variables.id) return item;
          let nextState = item.state;
          if (variables.command === "REOPEN") nextState = "OPEN";
          else if (variables.command === "CLOSE") nextState = "CLOSED";
          else if (variables.command === "CANCEL") nextState = "CANCELLED";
          return {
            ...item,
            state: nextState,
          };
        });
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        utils.needV2.listMine.setData(undefined, context.previousData);
      }
    },
    onSettled: () => {
      utils.needV2.listMine.invalidate();
    },
  });
  const beginEdit = trpc.needV2.beginEdit.useMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<VisibleNeedFilter>("ALL");
  const actions = t.core.management.actions;
  const copy = t.core.dashboardNeeds;

  const filterLabels: Record<VisibleNeedFilter, string> = useMemo(
    () => ({
      ALL: copy.filterAll,
      OPEN: copy.filterOpen,
      EXPIRED: copy.filterExpired,
      MATCHED: copy.filterMatched,
      CLOSED: copy.filterClosed,
    }),
    [copy],
  );

  // 过滤掉已取消/作废的需求，并按照从最新发布日期排序
  const activeNeeds = useMemo(() => {
    return (needs.data ?? [])
      .filter((need) => need.state !== "CANCELLED")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [needs.data]);

  const stats = useMemo(() => {
    const counts = VISIBLE_STATUS_KEYS.reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<VisibleNeedFilter, number>,
    );
    activeNeeds.forEach((need) => {
      const key = getNeedDisplayStatus(need);
      if (key !== "CANCELLED" && counts[key as VisibleNeedFilter] !== undefined) {
        counts[key as VisibleNeedFilter]++;
      }
      counts["ALL"]++;
    });
    return VISIBLE_STATUS_KEYS.map((key) => ({
      id: key,
      value: counts[key] ?? 0,
      label: filterLabels[key] ?? NEED_DISPLAY_CONFIG[key].label,
      textColor: NEED_DISPLAY_CONFIG[key].textColor,
    }));
  }, [activeNeeds, filterLabels]);

  const filteredNeeds = useMemo(() => {
    if (filterStatus === "ALL") return activeNeeds;
    return activeNeeds.filter(
      (need) => getNeedDisplayStatus(need) === filterStatus,
    );
  }, [activeNeeds, filterStatus]);

  const closeConfirm = useConfirmStore((state) => state.close);
  const setConfirmLoading = useConfirmStore((state) => state.setIsDeleting);
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null);

  const handleClose = async (
    need: NonNullable<typeof needs.data>[number],
  ) => {
    setActionError(null);
    const accepted = await confirm({
      title: actions.closeQuestion,
      confirmText: actions.close,
      cancelText: t.core.common.cancel,
      variant: "primary",
      content: <p>{actions.closeDetail}</p>,
    });
    if (!accepted) return;
    setConfirmLoading(true);
    try {
      await command.mutateAsync({
        id: need.id,
        command: "CLOSE",
        expectedUpdatedAt: new Date(need.updatedAt),
      });
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const handleReopen = async (
    need: NonNullable<typeof needs.data>[number],
  ) => {
    setActionError(null);
    if (need.expired) {
      setActionError(actions.reopenExpired);
      return;
    }
    try {
      await command.mutateAsync({
        id: need.id,
        command: "REOPEN",
        expectedUpdatedAt: new Date(need.updatedAt),
      });
    } catch {
      setActionError(actions.changedElsewhere);
    }
  };

  const handleDelete = async (
    need: NonNullable<typeof needs.data>[number],
  ) => {
    setActionError(null);
    const accepted = await confirm({
      title: actions.deleteQuestion,
      confirmText: actions.delete,
      cancelText: t.core.common.cancel,
      variant: "danger",
      content: <p>{actions.deleteDetail}</p>,
    });
    if (!accepted) return;
    setConfirmLoading(true);
    try {
      await command.mutateAsync({
        id: need.id,
        command: "CANCEL",
        expectedUpdatedAt: new Date(need.updatedAt),
      });
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const edit = (needId: string) => {
    setActionError(null);
    router.push(`/needs/edit/${needId}`);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden space-y-4">
      {/* 1. TOP HEADER: Exactly matching Overview typography and padding */}
      <div className="shrink-0 px-2 pt-2.5 pb-4 border-b border-slate-200/70 space-y-3">
        {/* 第一行：Title 单独一行 */}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {copy.userRequests}
        </h1>

        {/* 第二行：统计信息（左）与 新增按钮（右），左右布局，上下居中对齐 */}
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          {/* 左侧：状态统计筛选 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {stats.map((stat) => (
              <button
                key={stat.id}
                type="button"
                className={cn(
                  "group flex items-baseline gap-1 rounded-full px-3 py-1 transition text-xs",
                  filterStatus === stat.id
                    ? "bg-slate-200/90 font-bold"
                    : "hover:bg-slate-100/80 text-slate-500",
                )}
                onClick={() => setFilterStatus(stat.id)}
              >
                <span
                  className={cn(
                    "text-[11px] font-bold leading-none text-slate-400",
                    filterStatus === stat.id && "text-slate-700",
                  )}
                >
                  {stat.label}
                </span>
                <span
                  className={cn(
                    "text-base font-black tabular-nums tracking-tight",
                    stat.textColor,
                  )}
                >
                  {stat.value}
                </span>
                {copy.unit ? (
                  <span
                    className={cn(
                      "text-[10px] font-bold text-slate-400",
                      filterStatus === stat.id && "text-slate-700",
                    )}
                  >
                    {copy.unit}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* 右侧：新增按钮 */}
          <div className="shrink-0">
            <Button
              href="/needs/create"
              className="rounded-full px-4 py-2 text-xs font-bold shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1" strokeWidth={3} />
              {copy.create}
            </Button>
          </div>
        </div>

        <LegacyCompatibilityPanel kind="NEED" />

        {actionError ? (
          <p
            role="alert"
            className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs font-bold text-danger-text"
          >
            {actionError}
          </p>
        ) : null}
      </div>

      {/* 2. LOWER CONTENT AREA (Scrollable): 需求卡片网格 */}
      <div className="flex-1 overflow-y-auto pr-1 pb-8 pt-2">
        {needs.isLoading ? (
          <section className="rounded-2xl border border-[#ded9e0] bg-white p-8 text-center text-sm text-slate-500">
            {t.core.management.loadingRequests}
          </section>
        ) : needs.error ? (
          <section
            role="alert"
            className="rounded-2xl border border-danger-border bg-danger-bg p-5 text-sm text-danger-text"
          >
            {t.core.management.requestsError}
          </section>
        ) : activeNeeds.length === 0 ? (
          <div className="w-full rounded-2xl border border-[#ded9e0] bg-[#faf7fb] p-6">
            <EmptyState
              icon={<ClipboardList className="h-10 w-10" />}
              title={copy.emptyTitle}
              description={copy.emptyDescription}
              href="/needs/create"
              btnLabel={copy.create}
            />
          </div>
        ) : filteredNeeds.length === 0 ? (
          <div className="w-full rounded-2xl border border-[#ded9e0] bg-[#faf7fb] py-12 text-center text-sm text-slate-500">
            {copy.noFilteredResults}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNeeds.map((need) => {
              const isExpired =
              need.state === "OPEN" &&
              (need.expired ??
                new Date(need.endsAt) <= new Date());
            const visibleState = isExpired
              ? t.core.states.EXPIRED
              : t.core.states[need.state];

            const ModeIcon = requestModeIcons[need.mode] ?? PiHandHeart;

            const featuredPet = need.pets[0];
            const coverImage =
              featuredPet?.image ??
              need.attachments[0]?.attachment?.url ??
              null;
            const featuredPetLabel = featuredPet
              ? (featuredPet.name?.trim() ||
                  (t.core.pets[featuredPet.petType as keyof typeof t.core.pets] ??
                    featuredPet.petType))
              : "";
            const petsSummary = formatPetsSummary(
              need.pets as any,
              lang,
              messages[lang],
            );

            const cardTitle = formatNeedPetTitle(
              need.pets as any,
              lang,
              messages[lang],
            );

            // Date / Time schedule text
            const startDateStr = compactDate(need.startsAt, lang);
            const endDateStr = compactDate(need.endsAt, lang);
            const isSameDay =
              new Date(need.startsAt).toDateString() ===
              new Date(need.endsAt).toDateString();

            let timeDisplay = "";
            if (need.mode === "BOARDING") {
              const nights = calculateBoardingNights(need.startsAt, need.endsAt);
              timeDisplay = `${startDateStr} – ${endDateStr} · ${t.core.marketplace.nightsTotal.replace("{n}", String(nights))}`;
            } else if (need.mode === "CUSTOM") {
              timeDisplay = isSameDay
                ? startDateStr
                : `${startDateStr} – ${endDateStr}`;
            } else {
              const days = inclusiveDayCount(need.startsAt, need.endsAt);
              timeDisplay = isSameDay
                ? `${startDateStr} · ${t.core.marketplace.daysTotal.replace("{n}", "1")}`
                : `${startDateStr} – ${endDateStr} · ${t.core.marketplace.daysTotal.replace("{n}", String(days))}`;
            }

            // For HOME_VISIT: fold visits count into the time display row
            let timeDisplayFull = timeDisplay;
            if (need.mode === "HOME_VISIT" && need.homeVisitDetail) {
              const visits = calculateTotalHomeVisits(
                need.startsAt,
                need.endsAt,
                {
                  intervalDays: need.homeVisitDetail.intervalDays,
                  firstServiceDate: need.homeVisitDetail.firstServiceDate,
                  visitsPerServiceDay: need.homeVisitDetail.visitsPerServiceDay,
                  excludedDates: need.dateExceptions.map((d) => d.date),
                },
              ).totalVisits;
              const visitsLabel = t.core.marketplace.visitsTotal.replace(
                "{n}",
                String(visits),
              );
              timeDisplayFull = `${timeDisplay} · ${visitsLabel}`;
            }

            // Pricing
            const pricingInput: NeedPricingInput = {
              mode: need.mode,
              startsAt: need.startsAt,
              endsAt: need.endsAt,
              schedule: {
                homeVisit: need.homeVisitDetail
                  ? {
                      intervalDays: need.homeVisitDetail.intervalDays,
                      firstServiceDate: need.homeVisitDetail.firstServiceDate,
                      visitsPerServiceDay:
                        need.homeVisitDetail.visitsPerServiceDay,
                      excludedDates: need.dateExceptions.map((d) => d.date),
                    }
                  : null,
                boarding: need.boardingDetail
                  ? {
                      transportMode: need.boardingDetail.transportMode,
                      handoffDirection: need.boardingDetail.handoffDirection,
                      maxProviderDistanceMeters:
                        need.boardingDetail.maxProviderDistanceMeters,
                    }
                  : null,
              },
              budget: {
                kind: need.budgetKind as any,
                minAmountMinor: need.minAmountMinor,
                maxAmountMinor: need.maxAmountMinor,
                currency: need.currency,
                negotiable: need.negotiable,
              },
              additionalCosts: need.additionalCosts.map((c) => ({
                kind: c.kind,
                mode: c.mode,
                amountMinor: c.amountMinor,
              })),
            };
            const pricing = calculateNeedPricing(pricingInput);
            const budgetFormatted = formatNeedEstimatedBadge(
              pricing,
              t.core.common.openToOffers,
            );

            return (
              <article
                key={need.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs"
              >
                <Link
                  href={`/dashboard/needs/v2/${need.id}`}
                  className="block min-w-0"
                >
                  {/* 1. TOP: Pet Photo Cover / Default Avatar with Overlays */}
                  <div className="relative overflow-hidden">
                    <div className="relative h-[135px] w-full overflow-hidden bg-[#fff8e8]">
                      {coverImage ? (
                        <AppImage
                          src={coverImage}
                          alt={need.title}
                          width={480}
                          height={320}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span
                          role="img"
                          aria-label={featuredPetLabel}
                          className="block h-full w-full bg-[#fff8e8] bg-no-repeat transition duration-300 group-hover:scale-[1.03]"
                          style={{
                            backgroundImage:
                              "url('/images/pet-default-avatars-v2.png')",
                            backgroundPosition: petAvatarPosition(
                              featuredPet?.petType || "OTHER",
                            ),
                            backgroundSize: "400% auto",
                          }}
                        />
                      )}
                    </div>

                    {/* Mode Badge on top-left */}
                    <div
                      className={cn(
                        "absolute left-2 top-2 inline-flex max-w-[calc(100%-7.5rem)] items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs backdrop-blur-md",
                        modeBadgeThemes[need.mode] ?? modeBadgeThemes.HOME_VISIT,
                      )}
                    >
                      <ModeIcon
                        size={12}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {t.core.modes[
                          need.mode as keyof typeof t.core.modes
                        ] ?? need.mode}
                      </span>
                    </div>

                    {/* Status Badge on top-right */}
                    <div
                      className={cn(
                        "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs",
                        statusBadgeThemes[isExpired ? "EXPIRED" : need.state]
                          ?.container ?? "bg-slate-900/80 text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          statusBadgeThemes[isExpired ? "EXPIRED" : need.state]
                            ?.dot ?? "bg-slate-400",
                        )}
                      />
                      <span>{visibleState}</span>
                    </div>
                  </div>

                  {/* 2. BODY Content Area */}
                  <div className="flex flex-col gap-2.5 p-3.5">
                    {/* Title + Budget (Distinct styling) */}
                    <div>
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <h3
                          className="min-w-0 flex-1 truncate text-[14px] font-black text-slate-900 transition group-hover:text-primary"
                          title={cardTitle}
                        >
                          {cardTitle}
                        </h3>
                        {need.budgetKind === "OPEN" || need.minAmountMinor === null ? (
                          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
                            {budgetFormatted}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[12.5px] font-black tracking-tight text-primary tabular-nums">
                            {budgetFormatted}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-slate-400">
                        {copy.publishedAt}
                        {new Date(need.createdAt).toLocaleDateString(lang, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Key Info rows — enhanced contrast and breathing room */}
                    <div className="space-y-1.5 text-[11.5px] font-medium text-slate-600">
                      {/* Location */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <PiMapPinLine
                          size={13}
                          className="shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                        <p className="min-w-0 truncate">
                          <NeedLocationLabel
                            regionLabel={
                              need.locationSnapshot.regionLabel ?? null
                            }
                            mapPoint={{
                              lat: need.locationSnapshot.lat,
                              lon: need.locationSnapshot.lon,
                            }}
                            distanceMeters={null}
                            lang={lang}
                            fallback={t.core.marketplace.areaUnavailable}
                          />
                        </p>
                      </div>

                      {/* Date & Time (includes visits count for HOME_VISIT) */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <PiCalendarBlank
                          size={13}
                          className="shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                        <p className="min-w-0 truncate" title={timeDisplayFull}>
                          {timeDisplayFull}
                        </p>
                      </div>

                      {/* Pets summary */}
                      {petsSummary ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <PiPawPrint
                            size={13}
                            className="shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                          <p className="min-w-0 truncate" title={petsSummary}>
                            {petsSummary}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>

                {/* 3. MANAGEMENT FOOTER: Clear, active action buttons */}
                {mutable && (
                  <div className="px-3.5 pb-3.5">
                    <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
                      <button
                        type="button"
                        disabled={editingNeedId === need.id || command.isLoading}
                        onClick={() => void edit(need.id)}
                        className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-white px-2.5 py-1.5 text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        {editingNeedId === need.id ? (
                          <span className="inline-flex items-center justify-center gap-1.5">
                            <PiSpinner className="animate-spin" size={14} />
                            <span>{actions.edit}</span>
                          </span>
                        ) : (
                          actions.edit
                        )}
                      </button>
                      {need.state === "CLOSED" ? (
                        <button
                          type="button"
                          disabled={
                            command.isLoading ||
                            new Date(need.endsAt) <= new Date()
                          }
                          onClick={() => void handleReopen(need)}
                          className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actions.reopen}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={command.isLoading || isExpired}
                          onClick={() => void handleClose(need)}
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actions.close}
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={actions.delete}
                        title={actions.delete}
                        disabled={command.isLoading}
                        onClick={() => void handleDelete(need)}
                        className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
