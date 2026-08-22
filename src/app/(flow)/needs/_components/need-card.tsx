"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { useSession } from "next-auth/react";
import {
  PiBookmarkSimple,
  PiBookmarkSimpleFill,
  PiCalendarBlank,
  PiClock,
  PiHandHeart,
  PiHouseLine,
  PiMapPinLine,
  PiPawPrint,
  PiWarehouse,
} from "react-icons/pi";

import { AppImage } from "@/components/ui/app-image";
import UserAvatar from "@/components/shared/user-avatar";
import { useAuthModal } from "@/modules/auth/client/auth-modal-provider";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { trpc } from "@/utils/trpc";
import cn from "@/lib/cn";

export type Mode = "HOME_VISIT" | "BOARDING" | "CUSTOM";

export type PublicPet = {
  name: string | null;
  petType: string;
  quantity: number;
  image: string | null;
};

export type PublicTask = {
  category: string;
  label: string;
  priority?: string | null;
  scheduleKind?: string | null;
};

export type MarketplaceNeedItem = {
  publicId: string;
  title: string;
  mode: string;
  startsAt: Date | string;
  endsAt: Date | string;
  tasks?: PublicTask[];
  schedule: {
    homeVisit: {
      intervalDays: number | null;
      firstServiceDate: Date | string | null;
      visitsPerServiceDay: number | null;
      excludedDates: Array<Date | string>;
    } | null;
    boarding?: {
      transportMode: string | null;
      handoffDirection: string | null;
      maxProviderDistanceMeters: number | null;
    } | null;
    custom?: {
      timePreference: string | null;
      exactTime: string | null;
    } | null;
  };
  location: {
    regionLabel: string | null;
    mapPoint: { lat: number; lon: number };
    distanceMeters: number | null;
  };
  budget: {
    kind: string;
    minAmountMinor: number | null;
    maxAmountMinor: number | null;
    currency: string;
  };
  owner: {
    nickname: string | null;
    image: string | null;
    requestsCount?: number;
  };
  pets: PublicPet[];
};

const requestModeIcons: Record<Mode, ElementType> = {
  HOME_VISIT: PiHouseLine,
  BOARDING: PiWarehouse,
  CUSTOM: PiHandHeart,
};

const modeBadgeThemes: Record<Mode, string> = {
  HOME_VISIT: "bg-emerald-600 text-white shadow-emerald-950/20",
  BOARDING: "bg-amber-600 text-white shadow-amber-950/20",
  CUSTOM: "bg-violet-600 text-white shadow-violet-950/20",
};

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

function PetPhotoCover({ pet, label }: { pet: PublicPet; label: string }) {
  const [orientation, setOrientation] = useState<"landscape" | "square" | "portrait">("square");
  const heightClass =
    orientation === "portrait"
      ? "h-[220px] sm:h-[250px]"
      : orientation === "landscape"
        ? "h-[145px] sm:h-[165px]"
        : "h-[180px] sm:h-[205px]";

  return (
    <div
      className={`${heightClass} overflow-hidden bg-[#fff8e8] transition-[height] duration-300`}
      data-photo-orientation={orientation}
    >
      {pet.image ? (
        <div className="h-full overflow-hidden bg-slate-100">
          <AppImage
            src={pet.image}
            alt={label}
            width={640}
            height={480}
            onLoad={(event) => {
              const ratio =
                event.currentTarget.naturalWidth / event.currentTarget.naturalHeight;
              setOrientation(ratio > 1.15 ? "landscape" : ratio < 0.87 ? "portrait" : "square");
            }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
      ) : (
        <span
          role="img"
          aria-label={label}
          className="block h-full w-full bg-[#fff8e8] bg-no-repeat transition duration-500 group-hover:scale-[1.04]"
          style={{
            backgroundImage: "url('/images/pet-default-avatars-v2.png')",
            backgroundPosition: petAvatarPosition(pet.petType),
            backgroundSize: "400% auto",
          }}
        />
      )}
    </div>
  );
}

export {
  parseDateValue,
  inclusiveDayCount,
  calculateBoardingNights,
} from "@/domain/marketplace/need-pricing";

import {
  parseDateValue,
  inclusiveDayCount,
  calculateBoardingNights,
  calculateTotalHomeVisits,
  calculateNeedPricing,
  formatNeedEstimatedBadge,
  formatMoneyAmount,
} from "@/domain/marketplace/need-pricing";

function totalHomeVisits(
  startsAt: Date | string,
  endsAt: Date | string,
  schedule: {
    intervalDays: number | null;
    firstServiceDate: Date | string | null;
    visitsPerServiceDay: number | null;
    excludedDates: Array<Date | string>;
  } | null,
) {
  if (!schedule) return null;
  return calculateTotalHomeVisits(startsAt, endsAt, schedule).totalVisits;
}

export function compactDate(value: Date | string, lang: Lang) {
  const date = parseDateValue(value);
  if (!date) return "";
  return date.toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function isAreaLevelLabel(value: string | null | undefined) {
  if (!value) return false;
  if (/(expressway|highway|route|street|road|avenue|line|高速|道路|街道)/i.test(value))
    return false;
  return /[市区町村]|\b(city|ward|district|town|village)\b/i.test(value);
}

export function NeedLocationLabel({
  regionLabel,
  mapPoint,
  distanceMeters,
  lang,
  fallback,
}: {
  regionLabel: string | null;
  mapPoint: { lat: number; lon: number };
  distanceMeters: number | null;
  lang: Lang;
  fallback: string;
}) {
  const reverse = trpc.location.reverse.useQuery(
    { lat: mapPoint.lat, lon: mapPoint.lon, language: lang },
    {
      enabled: !isAreaLevelLabel(regionLabel),
      staleTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );
  const resolved = reverse.data?.[0]?.regionLabel;
  const area: string = isAreaLevelLabel(regionLabel)
    ? regionLabel!
    : isAreaLevelLabel(resolved)
      ? resolved!
      : fallback;
  const label =
    distanceMeters === null ? area : `${(distanceMeters / 1000).toFixed(1)} km · ${area}`;
  return <span title={label}>{label}</span>;
}

export function formatMoney(amount: number | null, currency: string, fallback: string) {
  if (amount === null) return fallback;
  return formatMoneyAmount(amount, currency);
}

export function formatBudget(
  budget: {
    kind: string;
    minAmountMinor: number | null;
    maxAmountMinor: number | null;
    currency: string;
  },
  fallback: string,
) {
  if (budget.kind === "OPEN" || budget.minAmountMinor === null) return fallback;
  const minimum = formatMoney(budget.minAmountMinor, budget.currency, fallback);
  if (budget.kind !== "RANGE" || budget.maxAmountMinor === null) return minimum;
  return `${minimum} – ${formatMoney(budget.maxAmountMinor, budget.currency, fallback)}`;
}

export function formatNeedCardBudget(need: MarketplaceNeedItem, fallback: string = "可协商") {
  const pricing = calculateNeedPricing(need);
  return formatNeedEstimatedBadge(pricing, fallback);
}

export function formatPetsSummary(
  pets: PublicPet[],
  lang: Lang,
  t: (typeof messages)[Lang],
): string {
  if (!pets || pets.length === 0) return "";

  const counts: Record<string, number> = {};
  let totalCount = 0;

  for (const pet of pets) {
    const rawType = (pet.petType || "OTHER").trim().toUpperCase();
    const qty = Math.max(1, pet.quantity || 1);
    counts[rawType] = (counts[rawType] || 0) + qty;
    totalCount += qty;
  }

  const typeEntries = Object.entries(counts);
  if (typeEntries.length === 0) return "";

  const petUnits: Record<
    Lang,
    { unit: string; totalPrefix: string; totalSuffix: string; separator: string }
  > = {
    zh: { unit: "只", totalPrefix: "共", totalSuffix: "只", separator: "、" },
    ja: { unit: "匹", totalPrefix: "全", totalSuffix: "匹", separator: "、" },
    en: { unit: "", totalPrefix: "", totalSuffix: " total", separator: ", " },
  };

  const config = petUnits[lang] ?? petUnits.zh;

  const parts = typeEntries.map(([typeKey, count]) => {
    const typeLabel =
      t.core.pets[typeKey as keyof typeof t.core.pets] ||
      (t.core.needPublishing.petTypes as Record<string, string>)[typeKey.toLowerCase()] ||
      typeKey;
    if (lang === "en") {
      return `${typeLabel} ×${count}`;
    }
    return `${typeLabel} ${count}${config.unit}`;
  });

  if (typeEntries.length === 1 && totalCount === typeEntries[0][1]) {
    return parts[0];
  }

  if (lang === "en") {
    return `${parts.join(config.separator)} · ${totalCount}${config.totalSuffix}`;
  }
  return `${parts.join(config.separator)} · ${config.totalPrefix}${totalCount}${config.totalSuffix}`;
}

export function NeedCard({
  need,
  lang,
  prefix,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  need: MarketplaceNeedItem;
  lang: Lang;
  prefix: string;
  index?: number;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const t = messages[lang];
  const copy = t.core.marketplace;
  const pendingCopy = t.core.pendingAction;
  const mode = (need.mode as Mode) || "HOME_VISIT";
  const ModeIcon = requestModeIcons[mode] ?? PiHandHeart;
  const badgeTheme = modeBadgeThemes[mode] ?? modeBadgeThemes.HOME_VISIT;
  const detailHref = `${prefix}/needs/${encodeURIComponent(need.publicId)}`;

  const session = useSession();
  const { openAuthModal } = useAuthModal();
  const utils = trpc.useContext();
  const targetInput = useMemo(
    () => ({ kind: "NEED" as const, publicId: need.publicId }),
    [need.publicId],
  );

  const favoriteQuery = trpc.favorite.state.useQuery(targetInput, {
    enabled: session.status === "authenticated",
    staleTime: 30_000,
  });

  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  useEffect(() => {
    if (typeof favoriteQuery.data?.favorite === "boolean") {
      setIsFavorited(favoriteQuery.data.favorite);
    }
  }, [favoriteQuery.data?.favorite]);

  const toggleFavoriteMutation = trpc.favorite.set.useMutation({
    onMutate: async ({ favorite }) => {
      await utils.favorite.state.cancel(targetInput);
      const previousState = utils.favorite.state.getData(targetInput);
      utils.favorite.state.setData(targetInput, { favorite });
      return { previousState };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousState) {
        utils.favorite.state.setData(targetInput, context.previousState);
        setIsFavorited(Boolean(context.previousState.favorite));
      }
    },
    onSettled: () => {
      utils.favorite.state.invalidate(targetInput);
      utils.favorite.listMine.invalidate();
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (session.status !== "authenticated") {
      openAuthModal();
      return;
    }

    const nextState = !isFavorited;
    setIsFavorited(nextState);
    toggleFavoriteMutation.mutate({
      target: targetInput,
      favorite: nextState,
    });
  };

  const petLabel = (pet: PublicPet) => {
    const petTypeLabel = t.core.pets[pet.petType as keyof typeof t.core.pets] ?? pet.petType;
    return pet.name?.trim() || petTypeLabel;
  };
  const featuredPet = need.pets.find((pet) => pet.image) ?? need.pets[0];
  const petsSummary = formatPetsSummary(need.pets, lang, t);

  // 1. Date string calculation per mode
  const startDateStr = compactDate(need.startsAt, lang);
  const endDateStr = compactDate(need.endsAt, lang);
  const isSameDay =
    new Date(need.startsAt).toDateString() === new Date(need.endsAt).toDateString();

  let timeDisplay = "";
  if (mode === "BOARDING") {
    // 寄养模式: 时间 · 总night数
    const nights = calculateBoardingNights(need.startsAt, need.endsAt);
    timeDisplay = `${startDateStr} – ${endDateStr} · ${copy.nightsTotal.replace("{n}", String(nights))}`;
  } else if (mode === "CUSTOM") {
    // 自定义需求: 时间 (同一天显示单日，加具体时间/时间段偏好)
    const timePrefKey = need.schedule.custom?.timePreference;
    const timePref = timePrefKey
      ? (t.core.needPublishing.timeOptions[
          timePrefKey as keyof typeof t.core.needPublishing.timeOptions
        ] ??
        need.schedule.custom?.exactTime ??
        "")
      : (need.schedule.custom?.exactTime ?? "");
    const baseDate = isSameDay ? startDateStr : `${startDateStr} – ${endDateStr}`;
    timeDisplay = timePref ? `${baseDate} · ${timePref}` : baseDate;
  } else {
    // 上门模式: 时间 · 总天数
    const days = inclusiveDayCount(need.startsAt, need.endsAt);
    timeDisplay = isSameDay
      ? `${startDateStr} · ${copy.daysTotal.replace("{n}", "1")}`
      : `${startDateStr} – ${endDateStr} · ${copy.daysTotal.replace("{n}", String(days))}`;
  }

  // 2. Line 4 Content (Task/Visits) - only for HOME_VISIT and CUSTOM
  let line4LeftIcon: ElementType | null = null;
  let line4LeftText: string | null = null;

  if (mode === "HOME_VISIT") {
    // 上门模式: 总visit数
    const totalVisits = totalHomeVisits(need.startsAt, need.endsAt, need.schedule.homeVisit);
    const days = inclusiveDayCount(need.startsAt, need.endsAt);
    line4LeftIcon = PiClock;
    line4LeftText =
      totalVisits === null
        ? copy.daysTotal.replace("{n}", String(days))
        : copy.visitsTotal.replace("{n}", String(totalVisits));
  } else if (mode === "CUSTOM") {
    // 自定义需求: 第一个任务
    const firstTask = need.tasks?.[0];
    const taskCategory = firstTask?.category;
    const localizedTask = taskCategory
      ? (t.core.needPublishing.taskLabels[
          taskCategory as keyof typeof t.core.needPublishing.taskLabels
        ] ?? firstTask.label)
      : (firstTask?.label || copy.careDetails);
    line4LeftIcon = PiHandHeart;
    line4LeftText = localizedTask;
  }

  // 3. Line 1 Extra Suffix (寄养需求范围)
  const boardingMaxDistanceMeters = need.schedule.boarding?.maxProviderDistanceMeters;
  const boardingRadiusText = boardingMaxDistanceMeters
    ? `${(boardingMaxDistanceMeters / 1000).toFixed(0)} km ${copy.radiusWithin}`
    : null;

  const budgetFormatted = formatNeedCardBudget(need, t.core.common.openToOffers);

  return (
    <Link
      href={detailHref}
      aria-label={`${t.core.modes[mode as keyof typeof t.core.modes] ?? mode} · ${timeDisplay}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative block w-full overflow-hidden rounded-2xl border bg-white text-left transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isHovered
          ? "border-primary/60 -translate-y-1 shadow-[0_16px_36px_-18px_rgba(109,40,217,0.35)] ring-2 ring-primary/20"
          : "border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(25,15,45,0.06)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(50,25,90,0.18)] hover:border-slate-300",
      )}
    >
      {/* 1. TOP: Clean, Unobscured Pet Photo Area */}
      <div className="relative overflow-hidden">
        <PetPhotoCover pet={featuredPet} label={petLabel(featuredPet)} />

        {/* High-Distinction Mode Badge on top-left */}
        <div
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex max-w-[calc(100%-3.5rem)] items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black shadow-md backdrop-blur-md",
            badgeTheme,
          )}
        >
          <ModeIcon size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {t.core.modes[mode as keyof typeof t.core.modes] ?? mode}
          </span>
        </div>

        {/* Favorite Bookmark Button on top-right (Instant Optimistic Toggle) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? pendingCopy.favoriteSaved : copy.saveRequest}
          title={isFavorited ? pendingCopy.favoriteSaved : copy.saveRequest}
          className={cn(
            "absolute right-2.5 top-2.5 grid h-7.5 w-7.5 place-items-center rounded-full shadow-sm backdrop-blur-sm transition-all duration-200 active:scale-90",
            isFavorited
              ? "bg-primary text-white shadow-md shadow-primary/30 ring-2 ring-white/80 scale-105"
              : "bg-white/95 text-slate-700 hover:bg-white hover:text-primary hover:shadow-md",
          )}
        >
          {isFavorited ? (
            <PiBookmarkSimpleFill
              size={17}
              className="text-white drop-shadow-sm"
              aria-hidden="true"
            />
          ) : (
            <PiBookmarkSimple size={17} aria-hidden="true" />
          )}
        </button>

        {/* Pet Name/Type Tag on bottom-left */}
        <div className="absolute bottom-2 left-2.5 inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-2 py-0.5 text-[10.5px] font-bold text-white shadow-sm backdrop-blur-sm">
          <span>
            {featuredPet.quantity > 1
              ? `${petLabel(featuredPet)} ×${featuredPet.quantity}`
              : petLabel(featuredPet)}
          </span>
        </div>

        {/* Total Budget Badge on bottom-right */}
        <div className="absolute bottom-2 right-2.5 inline-flex items-center rounded-full bg-slate-950/75 px-2.5 py-0.5 text-xs sm:text-[13px] font-black tracking-tight text-white shadow-md backdrop-blur-md border border-white/15">
          <span>{budgetFormatted}</span>
        </div>
      </div>

      {/* 2. BODY: Clean Content Area (White background, high contrast, natural height) */}
      <div className="p-3 sm:p-3.5 space-y-2.5">
        <div className="space-y-2">
          {/* Line 1: Address (with boarding radius if applicable) */}
          <div className="flex min-h-[18px] items-center gap-1.5 text-slate-700 font-semibold">
            <PiMapPinLine size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            <p className="min-w-0 truncate text-[11.5px]">
              <NeedLocationLabel
                regionLabel={need.location.regionLabel}
                mapPoint={need.location.mapPoint}
                distanceMeters={need.location.distanceMeters}
                lang={lang}
                fallback={copy.areaUnavailable}
              />
              {boardingRadiusText ? ` · ${boardingRadiusText}` : ""}
            </p>
          </div>

          {/* Line 2: Date & Time */}
          <div className="flex min-h-[18px] items-center gap-1.5 text-slate-500 font-medium">
            <PiCalendarBlank size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            <p className="min-w-0 truncate text-[11.5px]" title={timeDisplay}>
              {timeDisplay}
            </p>
          </div>

          {/* Line 3: Pet summary: 几只宠物、什么类别 (例如：猫 2只、兔子 1只 · 共3只) */}
          {petsSummary ? (
            <div className="flex min-h-[18px] items-center gap-1.5 text-slate-600 font-medium">
              <PiPawPrint size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
              <p className="min-w-0 truncate text-[11.5px]" title={petsSummary}>
                {petsSummary}
              </p>
            </div>
          ) : null}

          {/* Line 4: Task / Frequency / Service details */}
          {line4LeftText && line4LeftIcon ? (
            <div className="flex min-h-[18px] items-center gap-1.5 text-slate-700 font-semibold">
              {line4LeftIcon === PiClock ? (
                <PiClock
                  size={13}
                  className="shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              ) : line4LeftIcon === PiWarehouse ? (
                <PiWarehouse
                  size={13}
                  className="shrink-0 text-amber-600"
                  aria-hidden="true"
                />
              ) : (
                <PiHandHeart
                  size={13}
                  className="shrink-0 text-violet-600"
                  aria-hidden="true"
                />
              )}
              <p className="min-w-0 truncate text-[11.5px]" title={line4LeftText}>
                {line4LeftText}
              </p>
            </div>
          ) : null}
        </div>

        {/* 3. FOOTER: Publisher Info (Left) + Detail CTA Button (Right) */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          {/* Owner info */}
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-full ring-1 ring-slate-200">
              <UserAvatar size={24} image={need.owner.image} name={need.owner.nickname} />
            </span>
            <p className="min-w-0 truncate text-[11px] font-bold text-slate-700">
              {need.owner.nickname || copy.ownerFallback}
            </p>
          </div>

          {/* CTA Link indicator (Right) */}
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-black text-primary transition group-hover:text-primary-hover group-hover:underline">
            <span>{copy.viewRequestAndApply}</span>
            <ChevronRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function NeedCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="group w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_-4px_rgba(25,15,45,0.06)] animate-pulse"
    >
      {/* 1. TOP Photo Cover Skeleton */}
      <div className="relative aspect-[4/3] w-full bg-slate-200">
        {/* Mode badge pill skeleton */}
        <div className="absolute left-2.5 top-2.5 h-5 w-16 rounded-full bg-slate-300/80" />
        {/* Favorite circle skeleton */}
        <div className="absolute right-2.5 top-2.5 h-7 w-7 rounded-full bg-slate-300/80" />
        {/* Pet type tag skeleton */}
        <div className="absolute bottom-2 left-2.5 h-4.5 w-14 rounded-full bg-slate-400/40" />
        {/* Budget badge skeleton */}
        <div className="absolute bottom-2 right-2.5 h-5 w-18 rounded-full bg-slate-400/50" />
      </div>

      {/* 2. BODY Content Skeleton */}
      <div className="p-3 sm:p-3.5 space-y-2.5">
        <div className="space-y-2">
          {/* Line 1: Location */}
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-slate-200" />
            <div className="h-3 w-3/4 rounded-md bg-slate-200" />
          </div>
          {/* Line 2: Date */}
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 rounded-md bg-slate-200" />
          </div>
          {/* Line 3: Pets */}
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 shrink-0 rounded-full bg-slate-200" />
            <div className="h-3 w-1/2 rounded-md bg-slate-200" />
          </div>
        </div>

        {/* 3. FOOTER Skeleton */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200" />
            <div className="h-3 w-16 rounded-md bg-slate-200" />
          </div>
          <div className="h-3 w-14 rounded-md bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
