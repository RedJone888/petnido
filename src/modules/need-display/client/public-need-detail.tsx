"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  HeartPulse,
  MapPin,
  MoreHorizontal,
  NotebookText,
  Package,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Scale,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/dropdown-menu";
import {
  PiBookOpen,
  PiBowlFood,
  PiCalendarBlank,
  PiClock,
  PiFileText,
  PiHouseSimple,
  PiListChecks,
  PiPackage,
  PiPawPrint,
  PiShieldCheck,
  PiSuitcase,
} from "react-icons/pi";

import { AppImage } from "@/components/ui/app-image";
import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";
import { localizePetBreed } from "@/domain/pet/profile-options";
import { petAvatarPosition } from "@/domain/pet/avatar";
import { needDisplayDateRange } from "@/domain/marketplace/need-date-range";
import {
  calculateNeedPricing,
  inclusiveDayCount,
  calculateBoardingNights,
} from "@/domain/marketplace/need-pricing";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/server/trpc";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import cn from "@/lib/cn";
import { NeedDetailSkeleton } from "./need-detail-skeleton";
import { buildNeedOverview, buildPublicNeedTitle } from "../domain";
import { getNeedDisplayMessages } from "../i18n";
import { localizeTaskLabel } from "@/modules/need-publishing/domain/task-catalog";
import {
  buildStructuredSupplyRows,
  customScheduleSummaryBadge,
  customTimeLabel,
  formatDateSpan,
  formatHomeVisitFrequency,
  formatPetAge,
  formatPetGenderAndNeuter,
  formatPetWeight,
  formatPublishedAt,
  formatTransportModeLabel,
  formatVisitWindowTime,
  getSupplyCategoryBadgeInfo,
  groupAdjacentSupplies,
  groupPetsAndTasks,
  isCoordinateLocationLabel,
  modeColorMap,
  taskPriorityInfo,
  taskScheduleKindInfo,
} from "./_utils/presentation-formatters";
import { PetGroupTaskTable } from "./_components/pet-group-task-layout";
import { NeedActionSidebar } from "./_components/need-action-sidebar";

const MapLibreMap = dynamic(() => import("@/components/location/MapLibreMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[15rem] bg-slate-100/90 animate-pulse rounded-xl flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-[#ff8243] border-t-transparent animate-spin" />
    </div>
  ),
});

const NeedCalendarView = dynamic(() => import("./_components/need-calendar-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-44 bg-slate-50 animate-pulse rounded-xl" />
  ),
});

export function PublicNeedDetail({
  publicId,
  initialLanguage,
  initialData,
  staticDataByLanguage,
  readOnly = false,
  backLink,
}: {
  publicId: string;
  initialLanguage?: Lang;
  initialData?: any;
  staticDataByLanguage?: Record<Lang, RouterOutputs["marketplaceNeed"]["get"]>;
  readOnly?: boolean;
  backLink?: { href: string; label: Record<Lang, string> };
}) {
  const decodedPublicId = decodeURIComponent(publicId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = usePageLanguage(initialLanguage);
  const t = messages[lang];
  const needCopy = getNeedPublishingMessages(lang);
  const displayCopy = getNeedDisplayMessages(lang);
  const copy = t.core.marketplace;
  const actions = t.core.management.actions;
  const prefix = initialLanguage ? `/${initialLanguage}` : "";
  const { data: session, status: sessionStatus } = useSession();
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const setConfirmLoading = useConfirmStore((state) => state.setIsDeleting);
  const [actionError, setActionError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const reuseNeed = trpc.needV2.reuse.useMutation();
  const command = trpc.needV2.executeCommand.useMutation({
    onSuccess: () => {
      void need.refetch();
      void utils.needV2.getMine.invalidate();
    },
  });

  const need = trpc.marketplaceNeed.get.useQuery(
    { publicId: decodedPublicId },
    {
      initialData: staticDataByLanguage?.[lang] ?? initialData ?? undefined,
      enabled: !staticDataByLanguage,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  );
  const needData = staticDataByLanguage?.[lang] ?? need.data;
  const sitterLocations = trpc.savedLocation.listMine.useQuery(undefined, {
    enabled: !readOnly && sessionStatus === "authenticated",
    retry: false,
    refetchOnWindowFocus: false,
  });
  const reverseLocation = trpc.location.reverse.useQuery(
    {
      lat: needData?.location.mapPoint.lat ?? 0,
      lon: needData?.location.mapPoint.lon ?? 0,
      language: lang,
    },
    {
      enabled: Boolean(
        !readOnly &&
          needData &&
          (!needData.location.label?.trim() ||
            isCoordinateLocationLabel(needData.location.label) ||
            !needData.location.regionLabel?.trim() ||
            isCoordinateLocationLabel(needData.location.regionLabel)),
      ),
      staleTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  const [expandedVisits, setExpandedVisits] = useState<Record<number, boolean>>({});
  const [sitterMapPoint, setSitterMapPoint] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (readOnly) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setSitterMapPoint({ lat: coords.latitude, lon: coords.longitude }),
      () => setSitterMapPoint(null),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 },
    );
  }, [readOnly]);

  const toggleVisit = (idx: number) => {
    setExpandedVisits((prev) => {
      const isCurrentlyExpanded = prev[idx] ?? true;
      return { ...prev, [idx]: !isCurrentlyExpanded };
    });
  };

  if (!staticDataByLanguage && need.isLoading) {
    return <NeedDetailSkeleton />;
  }

  if (!needData) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FAF8F5] px-4 text-center">
        <div className="rounded-3xl border border-[#EDE8E1] bg-white p-8 shadow-sm max-w-md w-full">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#2B231D]">{displayCopy.unavailableDetail}</h2>
          <p className="mt-2 text-sm text-[#706A60]">
            {displayCopy.unavailableDescription}
          </p>
          <Link
            href={`${prefix}/needs`}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#5d35be] transition"
          >
            <ArrowLeft size={16} />
            {displayCopy.backNeeds}
          </Link>
        </div>
      </main>
    );
  }

  const item = needData;
  const savedSitterLocation = sitterLocations.data?.find((location) => location.isDefault) ?? sitterLocations.data?.[0];
  const effectiveSitterMapPoint = sitterMapPoint ?? (savedSitterLocation ? {
    lat: Number(savedSitterLocation.lat),
    lon: Number(savedSitterLocation.lon),
  } : null);
  const reverseResult = reverseLocation.data?.[0];
  const storedRegionLabel = item.location.regionLabel?.trim() || null;
  const storedLocationLabel = item.location.label?.trim() || null;
  const displayRegionLabel: string | null =
    storedRegionLabel && !isCoordinateLocationLabel(storedRegionLabel)
      ? storedRegionLabel
      : reverseResult?.regionLabel?.trim() ||
        storedRegionLabel ||
        t.core.common.approximateArea ||
        null;
  const displayLocationLabel: string | null =
    storedLocationLabel && !isCoordinateLocationLabel(storedLocationLabel)
      ? storedLocationLabel
      : reverseResult?.label?.trim() ||
        displayRegionLabel;
  const displayTitle = buildPublicNeedTitle(
    { ...item, location: { ...item.location, regionLabel: displayRegionLabel } },
    lang,
  );
  const isStaticExample = Boolean(staticDataByLanguage || item.publicId.startsWith("v2:home-visit-guide-example"));
  const returnTo = `${prefix}/needs/${encodeURIComponent(publicId)}`;
  const displayDates = needDisplayDateRange(item);
  const daysTotal = inclusiveDayCount(displayDates.startDate, displayDates.endDate);
  const nightsTotal = calculateBoardingNights(item.startsAt, item.endsAt);
  const petTypeGroups = item.pets.reduce<
    Array<{ petType: string; pets: Array<(typeof item.pets)[number]> }>
  >((groups, pet) => {
    const petType = pet.petType.toUpperCase();
    const existing = groups.find((group) => group.petType === petType);
    if (existing) existing.pets.push(pet);
    else groups.push({ petType, pets: [pet] });
    return groups;
  }, []);

  const dateRangeLabel = formatDateSpan(displayDates.startDate, displayDates.endDate, lang);

  // Visit windows & frequency calculations
  const intervalDays = item.schedule?.homeVisit?.intervalDays || 1;
  const visitsPerDay = item.schedule?.homeVisit?.visitsPerServiceDay || 1;
  const visitWindows = item.schedule?.homeVisit?.visitWindows ?? [];

  const storyContent = buildNeedOverview(item, lang, {
    intervalDays,
    visitsPerDay,
    distanceLabel: item.schedule?.boarding?.maxProviderDistanceMeters
      ? `${Math.round(item.schedule.boarding.maxProviderDistanceMeters / 100) / 10} km`
      : null,
    ownerSupplyLabels: item.supplies.filter((supply) => supply.providedBy === "OWNER").map((supply) => supply.label),
    sitterSupplyLabels: item.supplies.filter((supply) => supply.providedBy === "PROVIDER").map((supply) => supply.label),
    timeLabel: item.source === "V2" && item.schedule.custom
      ? customTimeLabel(item.schedule.custom.timePreference, item.schedule.custom.exactTime, t, needCopy)
      : null,
  });

  // Centralized Domain Pricing Calculation
  const pricing = calculateNeedPricing(item);
  const totalVisitsCount = pricing.totalUnitsCount;
  const serviceDaysCount = pricing.serviceDaysCount;
  const supplyGroups = groupAdjacentSupplies(item.supplies, item.pets);

  const homeVisitFrequencyLabel = formatHomeVisitFrequency(
    intervalDays,
    visitsPerDay,
    lang
  );

  const isOwner = !readOnly && Boolean(
    session?.user?.id && item.owner?.id && session.user.id === item.owner.id,
  );
  const isFromDashboard = searchParams?.get("from") === "dashboard" || isOwner;
  const isExpired =
    item.state === "OPEN" && new Date(item.endsAt) <= new Date();
  const effectiveState = isExpired ? "EXPIRED" : item.state ?? "OPEN";
  const canReopen = item.state === "CLOSED" && !isExpired;

  const handleEdit = () => {
    if (!item) return;
    setActionError(null);
    if (item.state === "MATCHED") {
      setActionError(actions.matchedEditBlocked);
      return;
    }
    if (item.state !== "OPEN" && item.state !== "CLOSED") {
      setActionError(actions.editUnavailable);
      return;
    }
    router.push(`/needs/edit/${item.id}`);
  };

  const handleReopen = async () => {
    if (!item) return;
    setActionError(null);
    if (isExpired) {
      setActionError(actions.reopenExpired);
      return;
    }
    try {
      await command.mutateAsync({
        id: item.id,
        command: "REOPEN",
        expectedUpdatedAt: new Date(item.updatedAt),
      });
      await need.refetch();
    } catch {
      setActionError(actions.changedElsewhere);
    }
  };

  const handleClose = async () => {
    if (!item) return;
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
        id: item.id,
        command: "CLOSE",
        expectedUpdatedAt: new Date(item.updatedAt),
      });
      await need.refetch();
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const handleCancelMatch = async () => {
    if (!item) return;
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
        id: item.id,
        command: "CANCEL_MATCH",
        expectedUpdatedAt: new Date(item.updatedAt),
      });
      await need.refetch();
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const handleReuse = async () => {
    if (!item) return;
    setActionError(null);
    const draftId = crypto.randomUUID();
    try {
      const input = { id: item.id, draftId };
      const draft = await reuseNeed.mutateAsync(input).catch(() =>
        reuseNeed.mutateAsync(input),
      );
      router.push(`/needs/create?draftId=${encodeURIComponent(draft.id)}`);
    } catch {
      setActionError(actions.changedElsewhere);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
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
        id: item.id,
        command: "ARCHIVE",
        expectedUpdatedAt: new Date(item.updatedAt),
      });
      router.push("/dashboard/needs");
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] w-full flex-col bg-[#FAF8F5] px-4 py-5 text-[#2B231D] sm:px-6 lg:h-[calc(100vh-64px)] lg:flex-row lg:gap-8 lg:overflow-hidden lg:px-8 lg:py-6 xl:gap-10 2xl:gap-12">
      {/* LEFT COLUMN: Fixed breadcrumb + one scroll area for title and content */}
      <div className="flex min-w-0 flex-1 flex-col lg:h-full lg:overflow-hidden">
        {/* Fixed breadcrumb */}
        <div className="shrink-0 bg-[#FAF8F5] pb-3">
          <div className="flex items-center text-xs text-slate-500">
            <nav aria-label={copy.breadcrumbLabel} className="flex items-center gap-1.5 flex-wrap">
              {backLink ? (
                <>
                  <Link
                    href={backLink.href}
                    className="inline-flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-primary"
                  >
                    <ArrowLeft size={13} />
                    {backLink.label[lang]}
                  </Link>
                  <ChevronRight size={12} className="shrink-0 text-slate-400" />
                  <span className="max-w-[200px] truncate font-bold text-slate-900 sm:max-w-xs" aria-current="page">
                    {displayTitle}
                  </span>
                </>
              ) : isFromDashboard ? (
                <>
                  <Link
                    href="/dashboard"
                    className="font-medium text-slate-500 hover:text-primary transition-colors"
                  >
                    {t.nav.accountCenter}
                  </Link>
                  <ChevronRight size={12} className="text-slate-400 shrink-0" />
                  <Link
                    href="/dashboard/needs"
                    className="font-medium text-slate-500 hover:text-primary transition-colors"
                  >
                    {t.core.dashboard.needs}
                  </Link>
                  <ChevronRight size={12} className="text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs" aria-current="page">
                    {displayTitle}
                  </span>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className="font-medium text-slate-500 hover:text-primary transition-colors"
                  >
                    {copy.breadcrumbHome}
                  </Link>
                  <ChevronRight size={12} className="text-slate-400 shrink-0" />
                  <Link
                    href={`${prefix}/needs`}
                    className="font-medium text-slate-500 hover:text-primary transition-colors"
                  >
                    {copy.breadcrumbNeeds}
                  </Link>
                  <ChevronRight size={12} className="text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs" aria-current="page">
                    {displayTitle}
                  </span>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Title, metadata and detail sections scroll together */}
        <div className="space-y-6 px-0 pb-4 lg:flex-1 lg:overflow-y-auto lg:pr-2">
          <div className="space-y-3 border-b border-[#EDE8E1]/60 pb-3">
            {/* Main Title Row with Status Pill and Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <h1 className="font-sans text-2xl font-extrabold leading-tight tracking-[-0.02em] text-[#2B231D] sm:text-3xl">
                  {displayTitle}
                </h1>
                {isStaticExample ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>{displayCopy.statusExample || (lang === "zh" ? "示例" : lang === "ja" ? "サンプル" : "Example")}</span>
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-2xs shrink-0",
                      effectiveState === "OPEN"
                        ? "bg-[#EAF3EC] border border-[#D5EADB] text-[#2D6A4F]"
                        : effectiveState === "MATCHED"
                          ? "bg-purple-50 border border-purple-200 text-purple-800"
                          : effectiveState === "EXPIRED"
                            ? "bg-amber-50 border border-amber-200 text-amber-800"
                            : "bg-slate-100 border border-slate-200 text-slate-600",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        effectiveState === "OPEN"
                          ? "bg-[#2D6A4F]"
                          : effectiveState === "MATCHED"
                            ? "bg-purple-500"
                            : effectiveState === "EXPIRED"
                              ? "bg-amber-500"
                              : "bg-slate-400",
                      )}
                    />
                    <span>
                      {t.core.states[effectiveState as keyof typeof t.core.states] ??
                        displayCopy.statusOpen}
                    </span>
                  </span>
                )}
              </div>

              {/* Owner Management Action Buttons (placed in the blank area to the right of title) */}
              {isOwner && item.source === "V2" && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {actionError && (
                    <span className="text-xs text-red-500 font-medium">
                      {actionError}
                    </span>
                  )}

                  {/* 1. Primary Action: Edit */}
                  <button
                    type="button"
                    disabled={command.isLoading || reuseNeed.isLoading}
                    onClick={() => void handleEdit()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-[#5d35be] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    <span>{actions.edit}</span>
                  </button>

                  {/* 2. More Actions Dropdown Menu */}
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={command.isLoading || reuseNeed.isLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.99] cursor-pointer disabled:opacity-50"
                      >
                        <MoreHorizontal size={14} className="text-slate-500" />
                        <span>{t.core.management.moreActions}</span>
                        <ChevronDown size={12} className="text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={6}
                      className="w-48 rounded-2xl border border-slate-200/90 bg-white p-1.5 text-xs font-semibold shadow-lg shadow-slate-200/50 z-50 animate-in fade-in zoom-in-95"
                    >
                      {/* Reopen action */}
                      {canReopen ? (
                        <DropdownMenuItem
                          onClick={() => void handleReopen()}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                        >
                          <PlayCircle size={15} className="text-emerald-600 shrink-0" />
                          <span>{actions.reopen}</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* Cancel match action */}
                      {item.state === "MATCHED" ? (
                        <DropdownMenuItem
                          onClick={() => void handleCancelMatch()}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 font-bold text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors"
                        >
                          <UserMinus size={15} className="text-purple-600 shrink-0" />
                          <span>{actions.cancelMatch}</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* Close recruitment action */}
                      {item.state === "OPEN" && !isExpired ? (
                        <DropdownMenuItem
                          onClick={() => void handleClose()}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <PauseCircle size={15} className="text-slate-500 shrink-0" />
                          <span>{actions.close}</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* Reuse action */}
                      <DropdownMenuItem
                        onClick={() => void handleReuse()}
                        className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 font-bold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <RotateCcw size={15} className="text-primary shrink-0" />
                        <span>{actions.reuse}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1 border-slate-100" />

                      {/* Delete action */}
                      <DropdownMenuItem
                        onClick={() => void handleDelete()}
                        className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 size={15} className="text-rose-500 shrink-0" />
                        <span>{actions.delete}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* 3. Close Details Button (Return to dashboard needs) */}
                  <Link
                    href="/dashboard/needs"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/80 bg-[#f4f2ee] hover:bg-[#eae6e0] px-3 py-1.5 text-xs font-bold text-[#5f574f] hover:text-[#2b231d] shadow-2xs transition active:scale-[0.99]"
                    title={displayCopy.backToNeeds}
                  >
                    <X size={14} className="text-[#8c8479]" />
                    <span>{displayCopy.closeDetailView}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Meta line */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-sm">
              <p className="flex items-center gap-1.5 font-bold text-[#2B231D]">
                <Calendar size={15} className="text-primary shrink-0" />
                <span>
                  {dateRangeLabel}
                  {item.mode === "HOME_VISIT" ? (
                    <span className="font-semibold text-[#5F5850]"> · {homeVisitFrequencyLabel}</span>
                  ) : null}
                </span>
              </p>

              <span className="hidden sm:inline-block h-3.5 w-px bg-[#E0D8CD] shrink-0" />

              <p className="flex items-center gap-1.5 text-xs font-medium text-[#8C8479]">
                <PiClock size={14} className="text-[#A59D91] shrink-0" />
                <span>
                  {displayCopy.posted(formatPublishedAt(item.createdAt, lang))}
                </span>
              </p>
            </div>
          </div>

          {/* Section: 📖 About this request */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <PiBookOpen size={22} className="text-primary" />
              <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                {displayCopy.overview}
              </h2>
            </div>
            <div className="pl-[30px] pr-3 sm:pr-4">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#4A423A]">
                {storyContent}
              </p>
            </div>
          </section>

          {/* Section: 🐾 Pets to care for */}
          <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
            <div className="flex items-center gap-2">
              <PiPawPrint size={22} className="text-primary" />
              <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                {displayCopy.pets}
              </h2>
            </div>

            <div className="space-y-5 pl-[30px] pr-3 sm:pr-4">
              {petTypeGroups.map((petGroup) => {
                const groupTypeLabel =
                  t.core.pets[petGroup.petType.toLowerCase() as keyof typeof t.core.pets] ??
                  t.core.pets[petGroup.petType as keyof typeof t.core.pets] ??
                  petGroup.petType;
                return (
                  <div key={petGroup.petType} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h3>{groupTypeLabel}</h3>
                    </div>
                    <div className="space-y-6">
                      {petGroup.pets.map((pet: any, petIndex: number) => {
                        const petLabel = t.core.pets[pet.petType as keyof typeof t.core.pets] ?? pet.petType;
                        const breedLabel = pet.breed ? localizePetBreed(pet.breed, lang, pet.petType) : null;
                        const ageText = formatPetAge(pet.birthDate, t);
                        const genderInfo = formatPetGenderAndNeuter(pet.sex, pet.neutered, lang);
                        const weightText = formatPetWeight(pet.weightGrams, lang);

                        return (
                          <div
                            key={`${pet.name || pet.petType}-${petIndex}`}
                            className="flex w-full flex-col md:flex-row md:items-start gap-4 md:gap-7"
                          >
                            <div className="flex shrink-0 items-start gap-3.5 sm:min-w-[220px] md:max-w-[280px]">
                              {/* Pet Avatar with Hover Enlarged Preview */}
                              <div className="group relative h-20 w-20 shrink-0 sm:h-[5.5rem] sm:w-[5.5rem]">
                                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-100 bg-[#FFF8E8] shadow-2xs sm:h-[5.5rem] sm:w-[5.5rem]">
                                  {pet.image ? (
                                    <AppImage
                                      src={pet.image}
                                      alt={pet.name || petLabel}
                                      width={88}
                                      height={88}
                                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <span
                                      role="img"
                                      aria-label={petLabel}
                                      className="block h-full w-full bg-[#fff8e8] bg-no-repeat"
                                      style={{
                                        backgroundImage: "url('/images/pet-default-avatars-v2.png')",
                                        backgroundPosition: petAvatarPosition(pet.petType),
                                        backgroundSize: "400% auto",
                                      }}
                                    />
                                  )}
                                </div>

                                {pet.image ? (
                                  <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3.5 z-50 pointer-events-none opacity-0 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:scale-100 origin-left">
                                    <div className="w-56 h-56 sm:w-64 sm:h-64 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-2xl ring-1 ring-black/10">
                                      <AppImage
                                        src={pet.image}
                                        alt={pet.name || petLabel}
                                        width={300}
                                        height={300}
                                        className="h-full w-full object-cover rounded-xl"
                                      />
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* Name & Attributes */}
                              <div className="flex min-w-0 flex-col justify-center py-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-extrabold leading-tight text-[#2B231D]">
                                    {pet.name || `${petLabel} #${petIndex + 1}`}
                                  </h3>
                                </div>

                                {breedLabel ? (
                                  <p className="mt-0.5 truncate text-xs font-medium text-[#706A60]" title={breedLabel}>
                                    {breedLabel}
                                  </p>
                                ) : null}

                                <div className="mt-2 flex min-w-0 flex-col gap-1.5 text-xs font-medium text-[#5F5850]">
                                  {ageText || weightText ? (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                                      {ageText ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <PiCalendarBlank className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                          <span>{ageText}</span>
                                        </span>
                                      ) : null}
                                      {weightText ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <Scale className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                          <span>{weightText}</span>
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {genderInfo ? (
                                    <div className="flex min-w-0 items-start gap-1.5 leading-5">
                                      <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                                      <span className="min-w-0">{genderInfo.label}</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {pet.careNotes ? (
                              <div className="flex min-w-0 flex-1 items-start gap-2 pt-1 text-xs text-[#706A60]">
                                <NotebookText size={15} className="mt-0.5 shrink-0 text-[#A59D91]" />
                                <p className="min-w-0 whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">
                                  {pet.careNotes}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: 📅 Care schedule & tasks */}
          <section className="space-y-4 border-t border-[#E7E0D8]/80 pt-5">
            <div className="flex items-center gap-2">
              {item.mode === "BOARDING" ? (
                <PiListChecks size={22} className="text-primary" />
              ) : item.mode === "CUSTOM" ? (
                <PiFileText size={22} className="text-primary" />
              ) : (
                <PiClock size={22} className="text-primary" />
              )}
              <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                {displayCopy.tasks}
              </h2>
            </div>

            {item.mode === "HOME_VISIT" && item.source === "V2" && item.scheduleNotes ? (
              <div className="ml-[30px] mr-3 rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm text-[#514956] shadow-2xs sm:mr-4">
                <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                  <PiFileText size={16} />
                  <span>{displayCopy.scheduleNotesHeading}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap leading-relaxed break-words">
                  {item.scheduleNotes}
                </p>
              </div>
            ) : null}

            {item.mode === "HOME_VISIT" ? (
              <div className="space-y-3.5 pl-[30px] pr-3 sm:pr-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-1 text-xs sm:grid-cols-4">
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">{displayCopy.frequency}</span>
                    <span className="block text-base font-black text-[#2B231D]">
                      {displayCopy.everyDays(intervalDays)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">
                      {displayCopy.visitsPerDay(visitsPerDay)}
                    </span>
                    <span className="block text-base font-black text-[#2B231D]">
                      {visitsPerDay}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">{displayCopy.totalVisits}</span>
                    <span className="block text-base font-black text-[var(--primary)]">
                      {displayCopy.totalVisitsCount(totalVisitsCount)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold text-[#8C8479]">{displayCopy.serviceDays}</span>
                    <span className="block text-base font-black text-[#2B231D]">
                      {displayCopy.totalDaysCount(serviceDaysCount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: visitsPerDay }).map((_, vIdx) => {
                    const window = visitWindows[vIdx];
                    const windowTimeLabel = formatVisitWindowTime(window, lang, t, needCopy);
                    const isExpanded = expandedVisits[vIdx] ?? true;

                    const visitTasks = item.tasks
                      .filter((task) => {
                        if (!task.visitNumbers || task.visitNumbers.length === 0) return true;
                        return task.visitNumbers.includes(vIdx + 1);
                      })
                      .sort(
                        (a, b) =>
                          ((a.orderByVisit?.[vIdx + 1] ?? Number.MAX_SAFE_INTEGER) -
                            (b.orderByVisit?.[vIdx + 1] ?? Number.MAX_SAFE_INTEGER)),
                      );

                    const visitGroups = groupPetsAndTasks(item.pets, visitTasks, lang, t);
                    const displayedVisitTasks = visitGroups.flatMap((group) => group.tasks);
                    const sequenceByTask = new Map<object, number>(
                      displayedVisitTasks.map((task, taskIndex) => [task as object, taskIndex + 1]),
                    );

                    return (
                      <div
                        key={vIdx}
                        className="overflow-hidden"
                      >
                        <div
                          onClick={() => toggleVisit(vIdx)}
                          className="flex w-full cursor-pointer select-none items-center justify-between rounded-xl bg-primary/[0.07] px-3.5 py-3 transition hover:bg-primary/[0.11]"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-extrabold text-[#2B231D]">
                            <span>
                              {displayCopy.visit(vIdx + 1)}
                            </span>
                            <span className="text-slate-300 font-normal">·</span>
                            <span className="text-xs sm:text-sm font-semibold text-[#8C8479] inline-flex items-center gap-1.5">
                              <PiClock className="h-3.5 w-3.5 text-primary shrink-0" />
                              {windowTimeLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span>
                              {isExpanded ? displayCopy.collapse : displayCopy.expandTasks}
                            </span>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] table-auto text-left text-xs">
                              <thead className="border-b border-[#EDE8E1] bg-[#FAF6F0] text-[#706A60]">
                                <tr>
                                  <th className="w-[180px] whitespace-nowrap px-3 py-2.5 font-bold">
                                    {displayCopy.applicablePets}
                                  </th>
                                  <th className="px-3 py-2.5 font-bold">
                                    {displayCopy.careTasks}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EDE8E1] bg-white">
                                {visitGroups.map((group, groupIndex) => (
                                  <tr
                                    key={`${group.key}-${groupIndex}`}
                                    className="bg-white"
                                  >
                                    <td className="w-[180px] border-r border-[#EDE8E1] bg-white px-3 py-3 align-top">
                                      <div className="flex max-w-[156px] flex-wrap items-start gap-2">
                                        {group.pets.map((pet, petIndex) => {
                                          const petName =
                                            pet.name ||
                                            `${group.petTypeLabel} #${petIndex + 1}`;
                                          return (
                                            <div
                                              key={`${petName}-${petIndex}`}
                                              className="flex w-12 max-w-[48px] flex-col items-center gap-1 text-center"
                                            >
                                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#FFF8E8]">
                                                {pet.image ? (
                                                  <AppImage
                                                    src={pet.image}
                                                    alt={petName}
                                                    width={36}
                                                    height={36}
                                                    className="h-full w-full object-cover"
                                                  />
                                                ) : (
                                                  <span
                                                    aria-label={petName}
                                                    role="img"
                                                    className="block h-full w-full bg-no-repeat"
                                                    style={{
                                                      backgroundImage:
                                                        "url('/images/pet-default-avatars-v2.png')",
                                                      backgroundPosition:
                                                        petAvatarPosition(
                                                          pet.petType,
                                                        ),
                                                      backgroundSize:
                                                        "400% auto",
                                                    }}
                                                  />
                                                )}
                                              </div>
                                              <span
                                                className="w-full truncate text-[11px] font-bold text-[#2B231D]"
                                                title={petName}
                                              >
                                                {petName}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="bg-white p-0 align-middle">
                                      <div className="flex min-w-0 flex-1 flex-col justify-center divide-y divide-[#EDE8E1]">
                                        {group.tasks.map((task, taskIndex) => {
                                          const priority = task.priority
                                            ? taskPriorityInfo(
                                                task.priority,
                                                lang,
                                              )
                                            : null;
                                          return (
                                            <div
                                              key={`${task.category}-${task.label}-${taskIndex}`}
                                              className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:flex-nowrap"
                                            >
                                              <div className="flex shrink-0 items-center gap-2">
                                                <span className="w-5 shrink-0 text-center font-bold text-primary">
                                                  {sequenceByTask.get(
                                                    task as object,
                                                  ) ?? taskIndex + 1}
                                                </span>
                                                <span className="font-bold leading-5 text-[#2B231D]">
                                                  {localizeTaskLabel(
                                                    task.label,
                                                    lang,
                                                    {
                                                      category: task.category,
                                                      custom: task.category
                                                        .toUpperCase()
                                                        .startsWith("CUSTOM"),
                                                    },
                                                  )}
                                                </span>
                                                {priority ? (
                                                  <span
                                                    className={cn(
                                                      "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                                      priority.className,
                                                    )}
                                                  >
                                                    {priority.text}
                                                  </span>
                                                ) : null}
                                              </div>
                                              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-[#514956] [overflow-wrap:anywhere]">
                                                {task.instructions ||
                                                  displayCopy.noNotes}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : item.mode === "BOARDING" ? (
              <div className="ml-[30px] mr-3 sm:mr-4">
                <table className="w-full table-auto text-left text-xs bg-white">
                  <thead className="bg-[#FAF6F0] border-b border-[#EDE8E1] text-[#706A60]">
                    <tr>
                      <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                        {displayCopy.applicablePets}
                      </th>
                      <th className="py-2.5 px-3 font-bold">
                        {displayCopy.careTasks}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8E1] bg-white">
                    {groupPetsAndTasks(item.pets, item.tasks, lang, t).map((group, groupIndex) => (
                      <tr key={`${group.key}-${groupIndex}`} className="bg-white">
                        <td className="py-3 px-3 align-middle bg-white border-r border-[#EDE8E1]">
                          <div className="flex max-w-[224px] flex-wrap items-center gap-2">
                            {group.pets.map((pet, petIndex) => {
                              const petName = pet.name || `${group.petTypeLabel} #${petIndex + 1}`;
                              return (
                                <div key={`${petName}-${petIndex}`} className="flex w-12 max-w-[48px] flex-col items-center gap-1 text-center">
                                  <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-[#FFF8E8] shrink-0">
                                    {pet.image ? (
                                      <AppImage src={pet.image} alt={petName} width={36} height={36} className="h-full w-full object-cover" />
                                    ) : (
                                      <span
                                        aria-label={petName}
                                        role="img"
                                        className="block h-full w-full bg-no-repeat"
                                        style={{
                                          backgroundImage: "url('/images/pet-default-avatars-v2.png')",
                                          backgroundPosition: petAvatarPosition(pet.petType),
                                          backgroundSize: "400% auto",
                                        }}
                                      />
                                    )}
                                  </div>
                                  <span className="w-full truncate text-[11px] font-bold text-[#2B231D]" title={petName}>{petName}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-1 px-0 align-middle bg-white">
                          <div className="min-w-0 flex-1 flex flex-col justify-center divide-y divide-[#EDE8E1]">
                            {group.tasks.map((task, idx) => {
                              const schedule = taskScheduleKindInfo(task.scheduleKind, lang, item.mode);

                              return (
                                <div
                                  key={`${task.category}-${task.label}-${idx}`}
                                  className="flex min-w-0 flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-xs"
                                >
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="w-5 shrink-0 text-center font-bold text-primary">{idx + 1}</span>
                                    <span className="font-bold leading-5 text-[#2B231D]">
                                      {localizeTaskLabel(task.label, lang, { category: task.category, custom: task.category.toUpperCase().startsWith("CUSTOM") })}
                                    </span>
                                    {schedule ? (
                                      <span className={cn("inline-flex shrink-0 rounded-full border px-2 py-0.5 font-semibold text-[11px]", schedule.className)}>
                                        {schedule.text}
                                      </span>
                                    ) : null}
                                  </div>
                                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-[#514956] [overflow-wrap:anywhere]">
                                    {task.instructions || displayCopy.noNotes}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-5 pl-[30px] pr-3 sm:pr-4">
                {customScheduleSummaryBadge(
                  displayDates.startDate,
                  displayDates.endDate,
                  item.source === "V2" ? item.schedule.custom?.timePreference : null,
                  item.source === "V2" ? item.schedule.custom?.exactTime : null,
                  lang,
                  t,
                  needCopy,
                ) ? (
                  <div className="rounded-xl bg-[#FAF6F0] p-3.5 border border-[#EFE7DC] text-xs font-bold text-[#8A5D34]">
                    {customScheduleSummaryBadge(
                      displayDates.startDate,
                      displayDates.endDate,
                      item.source === "V2" ? item.schedule.custom?.timePreference : null,
                      item.source === "V2" ? item.schedule.custom?.exactTime : null,
                      lang,
                      t,
                      needCopy,
                    )}
                  </div>
                ) : null}

                <PetGroupTaskTable
                  groups={groupPetsAndTasks(item.pets, item.tasks, lang, t)}
                  lang={lang}
                  t={t}
                  mode={item.mode}
                />
              </div>
            )}
            {item.description ? (
              <div className="ml-[30px] mr-3 rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm text-[#514956] shadow-2xs sm:mr-4">
                <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                  <PiFileText size={16} />
                  <span>{displayCopy.additionalCareNotes}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">{item.description}</p>
              </div>
            ) : null}
          </section>

          {/* Section: 📦 Supplies */}
          {item.mode === "BOARDING" ? (
            <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
              <div className="flex items-center gap-2">
                <Package size={22} className="text-primary" />
                <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                  {displayCopy.supplies}
                </h2>
              </div>
              <div className="ml-[30px] mr-3 sm:mr-4">
                {item.supplies.length ? (
                  <table className="w-full table-auto text-left text-xs bg-white">
                    <thead className="bg-[#FAF6F0] border-b border-[#EDE8E1] text-[#706A60]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold whitespace-nowrap">{displayCopy.applicablePets}</th>
                        <th className="w-32 py-2.5 px-3 font-bold whitespace-nowrap sm:w-36">{displayCopy.supplyCategory}</th>
                        <th className="py-2.5 px-3 font-bold">{displayCopy.supplyItem}</th>
                        <th className="w-28 py-2.5 px-3 text-center font-bold whitespace-nowrap sm:w-32">{displayCopy.supplyProvider}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8E1] bg-white">
                      {supplyGroups.flatMap((group, groupIndex) => {
                        const structuredSupplies = buildStructuredSupplyRows(group.supplies);

                        return structuredSupplies.map((supply, supplyIndex) => {
                          const sitterProvides = supply.providedBy === "PROVIDER";
                          const badge = getSupplyCategoryBadgeInfo(supply.category, lang);

                          return (
                            <tr
                              key={`${group.key}-${groupIndex}-${supply.id ?? supplyIndex}`}
                              className={sitterProvides ? "bg-amber-50/40" : "bg-white"}
                            >
                              {supplyIndex === 0 ? (
                                <td
                                  rowSpan={group.supplies.length}
                                  className="py-3 px-3 align-middle bg-white border-r border-[#EDE8E1]"
                                >
                                  <div className="flex max-w-[224px] flex-wrap items-center gap-2">
                                    {group.pets.map((pet, petIndex) => {
                                      const petName = pet.name || pet.petType;
                                      return (
                                        <div key={`${pet.id ?? petName}-${petIndex}`} className="flex w-12 max-w-[48px] flex-col items-center gap-1 text-center">
                                          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-[#FFF8E8] shrink-0">
                                            {pet.image ? <AppImage src={pet.image} alt={petName} width={36} height={36} className="h-full w-full object-cover" /> : <span role="img" aria-label={petName} className="block h-full w-full bg-no-repeat" style={{ backgroundImage: "url('/images/pet-default-avatars-v2.png')", backgroundPosition: petAvatarPosition(pet.petType), backgroundSize: "400% auto" }} />}
                                          </div>
                                          <span className="w-full truncate text-[11px] font-bold text-[#2B231D]" title={petName}>{petName}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              ) : null}

                              {supply.categoryRowSpan && supply.categoryRowSpan > 0 ? (
                                <td
                                  rowSpan={supply.categoryRowSpan}
                                  className="py-3 px-3 align-middle bg-white border-r border-[#EDE8E1]"
                                >
                                  <span
                                    className={cn(
                                      "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-tight shadow-2xs",
                                      badge.className,
                                    )}
                                  >
                                    <badge.Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span>{badge.label}</span>
                                  </span>
                                </td>
                              ) : null}

                              <td className="py-3 px-3 align-middle font-bold text-[#2B231D] border-r border-[#EDE8E1]">
                                {supply.label}
                              </td>

                              {supply.providerRowSpan && supply.providerRowSpan > 0 ? (
                                <td
                                  rowSpan={supply.providerRowSpan}
                                  className="py-3 px-3 align-middle text-center bg-white"
                                >
                                  <span
                                    className={cn(
                                      "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                                      sitterProvides
                                        ? "bg-amber-200 text-amber-950"
                                        : "border border-emerald-200/60 bg-emerald-50 text-emerald-800",
                                    )}
                                  >
                                    {sitterProvides ? displayCopy.sitterProvides : displayCopy.ownerProvides}
                                  </span>
                                </td>
                              ) : null}
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                ) : <p className="py-4 text-sm leading-6 text-[#706A60]">{displayCopy.noSupplies}</p>}
                {item.source === "V2" && item.schedule.boarding?.supplyNotes ? (
                  <div className="mt-3.5 rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                      <PiFileText size={16} />
                      <span>{displayCopy.additionalSupplyNotes}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-[#514956]">
                      {item.schedule.boarding.supplyNotes}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Section: 🛡️ Requirements / Home Fit */}
          {item.mode !== "HOME_VISIT" && item.requirements && item.requirements.length > 0 ? (
            <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
              <div className="flex items-center gap-2">
                <PiShieldCheck size={22} className="text-primary" />
                <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                  {item.mode === "BOARDING" ? displayCopy.homeFit : displayCopy.requirements}
                </h2>
              </div>
              {item.mode === "BOARDING" ? (() => {
                const required = item.requirements.filter((req) => req.kind === "ENVIRONMENT_REQUIRED");
                const avoid = item.requirements.filter((req) => req.kind === "UNACCEPTABLE" || req.kind === "WARNING");
                const additional = item.requirements.filter((req) => req.kind === "OTHER_NEED" || req.kind === "NOTE");

                return (
                  <div className="space-y-4 pl-[30px] pr-3 sm:pr-4">
                    {required.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                          <h3 className="text-sm font-bold text-[#2B231D] sm:text-base">
                            {displayCopy.homeRequired}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {required.map((req, idx) => (
                            <div
                              key={"id" in req ? req.id : idx}
                              className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-950 sm:text-sm"
                            >
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-800">
                                ✓
                              </span>
                              <span className="leading-snug">{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {avoid.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={17} className="shrink-0 text-amber-600" />
                          <h3 className="text-sm font-bold text-[#2B231D] sm:text-base">
                            {displayCopy.homeAvoid}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {avoid.map((req, idx) => (
                            <div
                              key={"id" in req ? req.id : idx}
                              className="flex items-center gap-2.5 rounded-xl border border-amber-200/60 bg-[#FFFDF9] px-3.5 py-2.5 text-xs font-semibold text-amber-950 sm:text-sm"
                            >
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                                ✕
                              </span>
                              <span className="leading-snug">{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {additional.length > 0 && (
                      <div className="rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs sm:text-sm shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                          <PiFileText size={16} />
                          <span>{displayCopy.additionalHomeFitNotes}</span>
                        </div>
                        <div className="mt-1.5 space-y-2 leading-relaxed text-[#514956]">
                          {additional.map((req, idx) => (
                            <p key={"id" in req ? req.id : idx} className="whitespace-pre-wrap">
                              {req.label}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="space-y-3 pl-[30px] pr-3 sm:pr-4">
                  {item.requirements.some((req) => req.kind !== "NOTE") ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {item.requirements.filter((req) => req.kind !== "NOTE").map((req, idx) => {
                        const caution = req.kind === "UNACCEPTABLE" || req.kind === "WARNING";
                        return (
                          <div key={"id" in req ? req.id : idx} className={cn("flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs font-semibold shadow-2xs", caution ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950")}>
                            {caution ? <AlertCircle size={16} className="shrink-0 text-amber-700" /> : <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />}
                            <div><p className="mb-1 font-black">{caution ? displayCopy.cautions : displayCopy.sitterRequirements}</p><span>{req.label}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {item.requirements.some((req) => req.kind === "NOTE") ? (
                    <div className="rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-4 text-xs text-[#514956] shadow-2xs sm:text-sm">
                      <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                        <PiFileText size={16} />
                        <span>{displayCopy.additionalRequirementNotes}</span>
                      </div>
                      <div className="mt-1.5 space-y-2 leading-relaxed">
                        {item.requirements.filter((req) => req.kind === "NOTE").map((req, idx) => (
                          <p key={"id" in req ? req.id : idx} className="whitespace-pre-wrap">{req.label}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}

          {/* Section: 📍 Service location Map */}
          <section className="space-y-3 border-t border-[#E7E0D8]/80 pt-5">
            <div className="flex items-center gap-2">
              <MapPin size={22} className="text-primary" />
              <h2 className="font-sans text-lg font-extrabold tracking-[-0.01em] text-[#2B231D] sm:text-xl">
                {item.mode === "HOME_VISIT" ? displayCopy.homeLocation : item.mode === "BOARDING" ? displayCopy.boardingLocation : displayCopy.customLocation}
              </h2>
            </div>
            <div className="pl-[30px] pr-3 sm:pr-4">
              {item.mode === "BOARDING" ? (
                <div className="mb-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                        {displayCopy.departureAreaLabel}:
                      </span>
                      <span className="font-bold text-[#2B231D]">{displayLocationLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                        {displayCopy.distancePreferenceLabel}:
                      </span>
                      <span className="font-bold text-[#2B231D]">
                        {item.schedule?.boarding?.maxProviderDistanceMeters
                          ? displayCopy.distancePreference(
                              `${Math.round(item.schedule.boarding.maxProviderDistanceMeters / 100) / 10} km`,
                            )
                          : displayCopy.noDistancePreference}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                        {displayCopy.handoffLabel}:
                      </span>
                      <span className="font-bold text-[#2B231D]">
                        {formatTransportModeLabel(
                          item.schedule?.boarding?.transportMode,
                          lang,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex items-center gap-2 text-xs sm:text-sm">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
                    {item.mode === "HOME_VISIT"
                      ? displayCopy.homeVisitAreaLabel
                      : displayCopy.serviceLocationLabel}
                    :
                  </span>
                  <span className="font-bold text-[#2B231D]">
                    {displayLocationLabel}
                  </span>
                </div>
              )}

              <div className="relative h-60 w-full overflow-hidden rounded-xl border border-[#EDE8E1]">
                <MapLibreMap
                  lat={item.location.mapPoint.lat}
                  lon={item.location.mapPoint.lon}
                  zoom={13}
                  editable={false}
                  showPrimaryMarker={true}
                  primaryMarkerLabel={displayCopy.ownerMapLocation}
                  primaryMarkerColor={modeColorMap[item.mode] || "#059669"}
                  additionalMarkers={effectiveSitterMapPoint ? [{
                    id: "current-sitter-location",
                    lat: effectiveSitterMapPoint.lat,
                    lon: effectiveSitterMapPoint.lon,
                    label: displayCopy.sitterMapLocation,
                    title: displayCopy.sitterMapLocation,
                    color: "#2563eb",
                  }] : []}
                  fitToMarkers={Boolean(
                    effectiveSitterMapPoint ||
                      (item.mode === "BOARDING" &&
                        item.schedule?.boarding?.maxProviderDistanceMeters),
                  )}
                  showPrivacyRadius={false}
                  searchRadiusKm={
                    item.mode === "BOARDING" &&
                    item.schedule?.boarding?.maxProviderDistanceMeters
                      ? item.schedule.boarding.maxProviderDistanceMeters / 1000
                      : null
                  }
                  scrollZoom={true}
                />
                {/* Floating Legend with Distinct Pin Icons (Matching /needs styling) */}
                <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-800 shadow-md backdrop-blur-sm">
                  {/* Owner Request Location Pin */}
                  <div className="flex items-center gap-1.5 text-slate-900">
                    <svg
                      width="13"
                      height="17"
                      viewBox="0 0 28 35"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0 drop-shadow-sm"
                      aria-hidden="true"
                    >
                      <path
                        d="M14 1C6.82 1 1 6.82 1 14C1 23.5 14 34 14 34C14 34 27 23.5 27 14C27 6.82 21.18 1 14 1Z"
                        fill={modeColorMap[item.mode] || "#059669"}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <circle cx="14" cy="14" r="4.5" fill="white" />
                    </svg>
                    <span className="truncate">{displayCopy.ownerMapLocation}</span>
                  </div>

                  {/* Sitter's Location Pin (Always Blue #2563eb) */}
                  {effectiveSitterMapPoint ? (
                    <div className="flex items-center gap-1.5 text-slate-900">
                      <svg
                        width="13"
                        height="17"
                        viewBox="0 0 28 35"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0 drop-shadow-sm"
                        aria-hidden="true"
                      >
                        <path
                          d="M14 1C6.82 1 1 6.82 1 14C1 23.5 14 34 14 34C14 34 27 23.5 27 14C27 6.82 21.18 1 14 1Z"
                          fill="#2563eb"
                          stroke="white"
                          strokeWidth="2"
                        />
                        <circle cx="14" cy="14" r="4.5" fill="white" />
                      </svg>
                      <span className="truncate">{displayCopy.sitterMapLocation}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 flex items-start gap-2 leading-6 text-sm text-amber-800">
                <AlertCircle size={17} className="mt-1 shrink-0 text-amber-600" />
                <span>{item.mode === "HOME_VISIT" ? displayCopy.homeLocationHint : item.mode === "BOARDING" ? displayCopy.boardingLocationHint : displayCopy.customLocationHint}</span>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* RIGHT COLUMN: Action Sidebar with Dynamic Calendar */}
      <NeedActionSidebar
        item={item}
        lang={lang}
        publicId={publicId}
        prefix={prefix}
        returnTo={returnTo}
        pricing={pricing}
        totalVisitsCount={totalVisitsCount}
        nightsTotal={nightsTotal}
        calendarSlot={<NeedCalendarView item={item} lang={lang} />}
        isOwner={isOwner}
        readOnly={readOnly}
      />
    </main>
  );
}
