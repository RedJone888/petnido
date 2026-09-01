"use client";

import {
  ChevronDown,
  ClipboardList,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
  User,
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
  PiWarehouse,
} from "react-icons/pi";

import cn from "@/lib/cn";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { mapNeedDraftPayloadToLegacyNeedDraftV3 } from "@/domain/publishing/legacy-need-draft-v3";
import { NEED_DRAFT_STORAGE_KEY } from "@/modules/need-publishing/client";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import EmptyState from "../../_components/EmptyState";
import {
  NEED_DISPLAY_CONFIG,
  type NeedDisplayStatus,
} from "@/domain/need/display-status";
import {
  compactDate,
  formatPetsSummary,
  formatPetsSummaryInfo,
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
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import {
  buildNeedDisplayTitle,
  buildNeedTitleParts,
} from "@/modules/need-publishing/domain/display-title";
import { petAvatarPosition } from "@/domain/pet/avatar";
import { resolveNeedCardPetMedia } from "@/domain/marketplace/need-card-media";
import { needDisplayDateRange } from "@/domain/marketplace/need-date-range";
import { DashboardNeedCardFrame, DashboardNeedCardSkeleton } from "./dashboard-need-card";

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

import {
  modeBadgeThemes,
  requestModeIcons,
} from "@/domain/care/care-themes";
import {
  needStatusThemes as statusBadgeThemes,
} from "@/domain/marketplace/need-status-theme";

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
  const needMessages = useNeedPublishingMessages();
  const router = useRouter();
  const confirm = useConfirm();
  const utils = trpc.useUtils();
  const needs = trpc.needV2.listMine.useQuery();
  const reuseNeed = trpc.needV2.reuse.useMutation();
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
          else if (variables.command === "CANCEL_MATCH") nextState = "CLOSED";
          else if (variables.command === "ARCHIVE" || variables.command === "CANCEL") {
            return null;
          }
          return {
            ...item,
            state: nextState,
          };
        }).filter(Boolean) as typeof old;
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<VisibleNeedFilter>("ALL");
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const actions = t.core.management.actions;
  const copy = needMessages.dashboardNeeds;

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

  // Archived requests are not returned by the router. Sort the remaining
  // published requests from newest to oldest.
  const activeNeeds = useMemo(() => {
    return (needs.data ?? [])
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
      if (counts[key as VisibleNeedFilter] !== undefined) {
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
    if (need.expired || new Date(need.endsAt) <= new Date()) {
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
        command: "ARCHIVE",
        expectedUpdatedAt: new Date(need.updatedAt),
      });
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const edit = (need: NonNullable<typeof needs.data>[number]) => {
    setActionError(null);
    if (need.state === "MATCHED") {
      setActionError(actions.matchedEditBlocked);
      return;
    }
    router.push(`/needs/edit/${need.id}`);
  };

  const handleCancelMatch = async (
    need: NonNullable<typeof needs.data>[number],
  ) => {
    setActionError(null);
    const accepted = await confirm({
      title: actions.cancelMatchQuestion,
      confirmText: actions.cancelMatch,
      cancelText: t.core.common.cancel,
      variant: "danger",
      content: <p>{actions.cancelMatchDetail}</p>,
    });
    if (!accepted) return;
    setConfirmLoading(true);
    try {
      await command.mutateAsync({
        id: need.id,
        command: "CANCEL_MATCH",
        expectedUpdatedAt: new Date(need.updatedAt),
      });
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const reuse = async (needId: string) => {
    setActionError(null);
    const draftId = crypto.randomUUID();
    try {
      const input = { id: needId, draftId };
      const draft = await reuseNeed.mutateAsync(input).catch(() =>
        reuseNeed.mutateAsync(input),
      );
      router.push(`/needs/create?draftId=${encodeURIComponent(draft.id)}`);
    } catch {
      setActionError(actions.changedElsewhere);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden space-y-4">
      {/* 1. TOP HEADER */}
      <div className="h-auto shrink-0 space-y-3 border-b border-slate-200/70 px-2 py-3 md:flex md:h-[var(--dashboard-title-height)] md:flex-col md:justify-center md:py-0">
        {/* 第一行：Title 单独一行 */}
        <h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">
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
                  "group flex items-baseline gap-1 rounded-full px-3 py-1 text-xs font-medium transition",
                  filterStatus === stat.id
                    ? "bg-slate-200/90 text-slate-700"
                    : "hover:bg-slate-100/80 text-slate-500",
                )}
                onClick={() => setFilterStatus(stat.id)}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none text-slate-400",
                    filterStatus === stat.id && "font-semibold text-slate-700",
                  )}
                >
                  {stat.label}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    stat.textColor,
                  )}
                >
                  {stat.value}
                </span>
                {copy.unit ? (
                  <span
                    className={cn(
                      "text-[10px] font-medium text-slate-400",
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
              className="rounded-full px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1" strokeWidth={3} />
              {copy.create}
            </Button>
          </div>
        </div>

      </div>

      {/* 2. LOWER CONTENT AREA (Scrollable): 需求卡片网格 */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-8 pr-1 pt-2">

        {actionError ? (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs font-bold text-danger-text"
          >
            {actionError}
          </p>
        ) : null}
        {needs.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <DashboardNeedCardSkeleton key={i} />
            ))}
          </div>
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
            />
          </div>
        ) : filteredNeeds.length === 0 ? (
          <div className="w-full rounded-2xl border border-[#ded9e0] bg-[#faf7fb] py-12 text-center text-sm text-slate-500">
            {copy.noFilteredResults}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNeeds.map((need) => {
              const hasEnded = new Date(need.endsAt) <= new Date();
              const isExpired =
                need.state === "OPEN" && (need.expired ?? hasEnded);
              const canReopen = need.state === "CLOSED" && !hasEnded;
              const visibleState = isExpired
                ? t.core.states.EXPIRED
                : t.core.states[need.state];

            const ModeIcon = requestModeIcons[need.mode] ?? PiHandHeart;

            const { firstPet, featuredPet, coverImage } =
              resolveNeedCardPetMedia(need.pets);
            const featuredPetLabel = featuredPet
              ? (featuredPet.name?.trim() ||
                  (t.core.pets[featuredPet.petType as keyof typeof t.core.pets] ??
                    featuredPet.petType))
              : "";
            const petsSummaryInfo = formatPetsSummaryInfo(
              need.pets as any,
              lang,
              messages[lang],
              needMessages,
            );

            const titleInfo = buildNeedTitleParts({
              mode: need.mode,
              pets: need.pets,
              tasks: (need as any).tasks,
              lang,
            });

            // Date / Time schedule text
            const displayDates = needDisplayDateRange({
              ...need,
              source: "V2",
            });
            const startDateStr = compactDate(displayDates.startDate, lang);
            const endDateStr = compactDate(displayDates.endDate, lang);
            const isSameDay = displayDates.startDate === displayDates.endDate;

            let dateRangeText = "";
            const scheduleBadges: string[] = [];

            if (need.mode === "BOARDING") {
              dateRangeText = `${startDateStr} – ${endDateStr}`;
              const nights = calculateBoardingNights(need.startsAt, need.endsAt);
              scheduleBadges.push(
                t.core.marketplace.nightsTotal.replace("{n}", String(nights)),
              );
            } else if (need.mode === "CUSTOM") {
              dateRangeText = isSameDay
                ? startDateStr
                : `${startDateStr} – ${endDateStr}`;
            } else {
              dateRangeText = isSameDay
                ? startDateStr
                : `${startDateStr} – ${endDateStr}`;
              const days = inclusiveDayCount(
                displayDates.startDate,
                displayDates.endDate,
              );
              scheduleBadges.push(
                t.core.marketplace.daysTotal.replace("{n}", String(days)),
              );
              if (need.homeVisitDetail) {
                const visits = calculateTotalHomeVisits(
                  need.startsAt,
                  need.endsAt,
                  {
                    intervalDays: need.homeVisitDetail.intervalDays,
                    firstServiceDate: need.homeVisitDetail.firstServiceDate,
                    visitsPerServiceDay: need.homeVisitDetail.visitsPerServiceDay,
                  },
                ).totalVisits;
                scheduleBadges.push(
                  t.core.marketplace.visitsTotal.replace(
                    "{n}",
                    String(visits),
                  ),
                );
              }
            }

            const timeDisplayFull = [dateRangeText, ...scheduleBadges].join(" · ");

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
              <DashboardNeedCardFrame key={need.id}>
                <Link
                  href={`/needs/v2%3A${need.id}?from=dashboard`}
                  className="block min-w-0"
                >
                  {/* 1. TOP: Pet Photo Cover / Default Avatar with Overlays */}
                  <div className="relative overflow-hidden">
                    <div className="relative h-[135px] w-full overflow-hidden bg-[#fff8e8]">
                      {coverImage ? (
                        <AppImage
                          src={coverImage}
                          alt={titleInfo.title}
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
                              firstPet?.petType || "OTHER",
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
                          className="min-w-0 flex-1 flex items-center gap-1.5 text-[14px] font-black text-slate-900 transition group-hover:text-primary"
                          title={titleInfo.title}
                        >
                          {titleInfo.petSummary ? (
                            <span className="shrink-0 inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[11px] font-bold text-primary ring-1 ring-inset ring-purple-500/15">
                              {titleInfo.petSummary}
                            </span>
                          ) : null}
                          <span className="min-w-0 truncate text-slate-900">
                            {titleInfo.taskSummary}
                          </span>
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
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-purple-100 bg-purple-50 text-primary">
                            {user?.image ? (
                              <AppImage src={user.image} alt={user.name || "PetNido user"} width={28} height={28} className="h-full w-full object-cover" />
                            ) : (
                              <User size={13} />
                            )}
                          </div>
                          <span className="min-w-0 truncate text-[11px] font-semibold text-slate-700">
                            {user?.name || user?.email || (lang === "zh" ? "PetNido 用户" : lang === "ja" ? "PetNidoユーザー" : "PetNido user")}
                          </span>
                        </div>
                        <time dateTime={new Date(need.createdAt).toISOString()} className="shrink-0 text-[10.5px] text-slate-400">
                          {copy.publishedAt}
                          {new Date(need.createdAt).toLocaleDateString(lang, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
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
                        <div className="flex min-w-0 items-center gap-1.5 truncate text-[11.5px]" title={timeDisplayFull}>
                          <span className="shrink-0 font-semibold text-slate-700">
                            {dateRangeText}
                          </span>
                          {scheduleBadges.map((badge, idx) => (
                            <span
                              key={idx}
                              className="shrink-0 inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/70"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pets summary */}
                      {petsSummaryInfo.details ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <PiPawPrint
                            size={13}
                            className="shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                          <div className="flex min-w-0 items-center gap-1.5 truncate text-[11.5px]" title={petsSummaryInfo.fullText}>
                            <span className="shrink-0 font-medium text-slate-700">
                              {petsSummaryInfo.details}
                            </span>
                            {petsSummaryInfo.totalBadge ? (
                              <span className="shrink-0 inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/70">
                                {petsSummaryInfo.totalBadge}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>

                {/* 3. MANAGEMENT FOOTER: frequent actions stay visible; low-frequency actions live in the menu. */}
                {mutable && (
                  <div className="px-3.5 pb-3.5">
                    <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
                      <button
                        type="button"
                        disabled={command.isLoading}
                        onClick={() => void edit(need)}
                        className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-white px-2.5 py-1.5 text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        {actions.edit}
                      </button>
                      {canReopen ? (
                        <button
                          type="button"
                          disabled={command.isLoading}
                          onClick={() => void handleReopen(need)}
                          className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actions.reopen}
                        </button>
                      ) : need.state === "MATCHED" ? (
                        <button
                          type="button"
                          disabled={command.isLoading}
                          onClick={() => void handleCancelMatch(need)}
                          className="flex-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 shadow-2xs transition hover:bg-purple-100 disabled:opacity-40"
                        >
                          {actions.cancelMatch}
                        </button>
                      ) : need.state === "OPEN" && !isExpired ? (
                        <button
                          type="button"
                          disabled={command.isLoading}
                          onClick={() => void handleClose(need)}
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actions.close}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        aria-label={t.core.management.moreActions}
                        title={t.core.management.moreActions}
                        aria-expanded={expandedActionId === need.id}
                        disabled={command.isLoading || reuseNeed.isLoading}
                        onClick={() =>
                          setExpandedActionId((current) =>
                            current === need.id ? null : need.id,
                          )
                        }
                        className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 text-slate-500 shadow-2xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50"
                      >
                        <MoreHorizontal size={15} />
                        <ChevronDown
                          size={12}
                          className={cn(
                            "transition-transform",
                            expandedActionId === need.id && "rotate-180",
                          )}
                        />
                      </button>
                    </div>
                    {expandedActionId === need.id ? (
                      <div className="absolute bottom-12 right-3 z-10 grid w-40 gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        <button
                          type="button"
                          disabled={reuseNeed.isLoading || command.isLoading}
                          onClick={() => void reuse(need.id)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                        >
                          <RotateCcw size={14} />
                          {actions.reuse}
                        </button>
                        <button
                          type="button"
                          disabled={command.isLoading}
                          onClick={() => void handleDelete(need)}
                          className="flex items-center gap-2 rounded-lg border-t border-slate-100 px-2.5 py-2 text-left text-xs font-semibold text-danger-text transition hover:bg-danger-bg disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {actions.delete}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </DashboardNeedCardFrame>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
