"use client";

import { useState } from "react";
import { Clock, Sparkles, User, X } from "lucide-react";
import { PiFileText } from "react-icons/pi";

import { AppImage } from "@/components/ui/app-image";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { formatNeedPricingFormula, formatMoneyAmount } from "@/domain/marketplace/need-pricing";
import type { RouterOutputs } from "@/server/trpc";
import { getNeedDisplayMessages } from "../../i18n";

type NeedDetailDTO = RouterOutputs["marketplaceNeed"]["get"];

const devNoticeCopy = {
  en: {
    applyTitle: "Application Feature In Development",
    applyDesc: "The care application and response feature is currently under active development. Stay tuned!",
    ownerTitle: "User Profile In Development",
    ownerDesc: "User profile details and reputation history are currently under active development. Stay tuned!",
    badge: "Coming Soon",
    button: "Got it",
  },
  zh: {
    applyTitle: "接单应聘功能正在开发中",
    applyDesc: "宠物照护接单与在线应聘功能正在火热开发中，敬请期待！",
    ownerTitle: "发布者主页正在开发中",
    ownerDesc: "发布者个人主页与信誉评价体系正在开发中，敬请期待！",
    badge: "功能开发中",
    button: "我知道了",
  },
  ja: {
    applyTitle: "応募機能は現在開発中です",
    applyDesc: "シッター応募およびチャット機能は現在開発中です。公開まで今しばらくお待ちください。",
    ownerTitle: "プロフィールページは現在開発中です",
    ownerDesc: "ユーザープロフィールおよび評価履歴は現在開発中です。公開まで今しばらくお待ちください。",
    badge: "開発中",
    button: "わかりました",
  },
} as const;

export function NeedActionSidebar({
  item,
  lang,
  publicId,
  prefix,
  returnTo,
  pricing,
  totalVisitsCount,
  nightsTotal,
  calendarSlot,
  isOwner = false,
  readOnly = false,
}: {
  item: NeedDetailDTO;
  lang: Lang;
  publicId: string;
  prefix: string;
  returnTo: string;
  pricing: any;
  totalVisitsCount: number;
  nightsTotal: number;
  calendarSlot: React.ReactNode;
  isOwner?: boolean;
  readOnly?: boolean;
}) {
  const t = messages[lang] ?? messages.en;
  const displayCopy = getNeedDisplayMessages(lang);
  const copy = t.core.marketplace;
  const modalText = devNoticeCopy[lang] ?? devNoticeCopy.zh;

  const [devModalType, setDevModalType] = useState<"apply" | "owner" | null>(null);

  // Home Visit specialized calculations
  const isCareOpen = pricing.budgetKind === "OPEN";
  const isCareRange = pricing.budgetKind === "RANGE";

  const careUnitRateMin = pricing.unitRateMinor;
  const careUnitRateMax = pricing.unitMaxRateMinor;

  const travelMode = pricing.travelMode; // "FIXED" | "ACTUAL" | "NONE"
  const isTravelActual = travelMode === "ACTUAL";
  const isTravelFixed = travelMode === "FIXED" && (pricing.fixedTravelPerVisitMinor ?? 0) > 0;
  const travelUnit = pricing.fixedTravelPerVisitMinor ?? 0;

  let bigPriceText = "";
  let bigPriceSubLabel: string | null = null;
  let formulaText: string | null = null;
  let statusNoteText: string | null = null;

  if (item.mode === "HOME_VISIT") {
    // 1. Big Price & Sublabel
    if (isCareOpen) {
      if (isTravelFixed && travelUnit > 0) {
        const travelTotal = travelUnit * totalVisitsCount;
        bigPriceText = formatMoneyAmount(travelTotal, pricing.currency);
        bigPriceSubLabel = displayCopy.estimatedTotal;
      } else {
        bigPriceText = displayCopy.discuss;
        bigPriceSubLabel = null;
      }
    } else if (isCareRange && careUnitRateMax) {
      const minTotal =
        pricing.estimatedTotalMinMinor ??
        ((careUnitRateMin ?? 0) + (isTravelFixed ? travelUnit : 0)) * totalVisitsCount;
      const maxTotal =
        pricing.estimatedTotalMaxMinor ??
        ((careUnitRateMax ?? 0) + (isTravelFixed ? travelUnit : 0)) * totalVisitsCount;
      bigPriceText = `${formatMoneyAmount(minTotal, pricing.currency)} – ${formatMoneyAmount(maxTotal, pricing.currency)}`;
      bigPriceSubLabel = displayCopy.estimatedTotal;
    } else {
      const exactTotal =
        pricing.estimatedTotalMinMinor ??
        ((careUnitRateMin ?? 0) + (isTravelFixed ? travelUnit : 0)) * totalVisitsCount;
      bigPriceText = formatMoneyAmount(exactTotal, pricing.currency);
      bigPriceSubLabel = displayCopy.estimatedTotal;
    }

    // 2. Formula & Note Logic
    if (!isTravelActual && !isCareOpen) {
      formulaText = isTravelFixed
        ? displayCopy.formulaCareAndTravelTimesVisits
        : displayCopy.formulaCareTimesVisits;
      statusNoteText = null;
    } else if (isTravelActual && !isCareOpen) {
      formulaText = displayCopy.formulaCareTimesVisits;
      statusNoteText = displayCopy.excludesTravel;
    } else if (!isTravelActual && isCareOpen) {
      if (isTravelFixed) {
        formulaText = displayCopy.formulaTravelTimesVisits;
        statusNoteText = displayCopy.excludesCare;
      } else {
        formulaText = null;
        statusNoteText = null;
      }
    } else if (isTravelActual && isCareOpen) {
      formulaText = null;
      statusNoteText = displayCopy.excludesTravel;
    }
  } else if (item.mode === "BOARDING") {
    if (isCareOpen) {
      bigPriceText = displayCopy.discuss;
      bigPriceSubLabel = null;
    } else if (isCareRange && careUnitRateMax) {
      bigPriceText = `${formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.estimatedTotalMaxMinor ?? 0, pricing.currency)}`;
      bigPriceSubLabel = displayCopy.estimatedTotal;
      formulaText = displayCopy.formulaNightlyTimesNights;
    } else {
      bigPriceText = formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency);
      bigPriceSubLabel = displayCopy.estimatedTotal;
      formulaText = displayCopy.formulaNightlyTimesNights;
    }
  } else {
    // CUSTOM
    bigPriceText =
      pricing.budgetKind === "OPEN"
        ? displayCopy.discuss
        : pricing.budgetKind === "RANGE" && pricing.estimatedTotalMaxMinor
        ? `${formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.estimatedTotalMaxMinor, pricing.currency)}`
        : formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency);
    bigPriceSubLabel = pricing.budgetKind === "OPEN" ? null : displayCopy.estimatedTotal;
  }

  // Keep the displayed formula aligned with the shared pricing engine
  formulaText = pricing.budgetKind === "OPEN" && bigPriceSubLabel === null
    ? null
    : formatNeedPricingFormula(pricing, lang);

  const careUnitPriceDisplay =
    pricing.budgetKind === "OPEN"
      ? displayCopy.discuss
      : pricing.budgetKind === "RANGE" && pricing.unitMaxRateMinor
      ? `${formatMoneyAmount(pricing.unitRateMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.unitMaxRateMinor, pricing.currency)}`
      : `${formatMoneyAmount(pricing.unitRateMinor ?? 0, pricing.currency)}`;

  const travelFeeDisplay =
    travelMode === "FIXED" && travelUnit > 0
      ? `${formatMoneyAmount(travelUnit, pricing.currency)}`
      : travelMode === "ACTUAL"
      ? displayCopy.actualCost
      : displayCopy.none;

  return (
    <aside className="w-full px-0 py-0 lg:sticky lg:top-20 lg:w-[328px] lg:shrink-0 lg:px-1 lg:py-1 xl:w-[344px] 2xl:w-[352px]">
      <div className="space-y-3 rounded-3xl border border-[#EDE8E1] bg-white p-4 shadow-sm lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
        {/* 1. Calendar Slot */}
        <div>
          {calendarSlot}
          {item.mode !== "HOME_VISIT" && item.source === "V2" && item.scheduleNotes ? (
            <div className="mt-3 max-h-28 overflow-y-auto rounded-xl border border-amber-200/90 bg-[#FFF9EE] p-3 text-xs leading-5 text-[#514956] shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-[#8A5D34]">
                <PiFileText size={15} />
                <span>{displayCopy.scheduleNote}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{item.scheduleNotes}</p>
            </div>
          ) : null}
        </div>

        {/* 2. Amount & Breakdown Section */}
        <div className="space-y-3 pt-3 border-t border-[#F2EFE9]">
          {/* Big Price Display & Formula */}
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span suppressHydrationWarning className="whitespace-nowrap font-sans text-xl font-black tracking-tight text-primary sm:text-2xl xl:text-[1.65rem]">
                {bigPriceText}
              </span>
              {bigPriceSubLabel ? (
                <span className="text-xs font-semibold text-slate-500">
                  {bigPriceSubLabel}
                </span>
              ) : null}
              {pricing.isNegotiable && !isCareOpen && !isCareRange ? (
                <span className="rounded-full bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {displayCopy.negotiable}
                </span>
              ) : null}
            </div>

            {/* Formula & Note subline */}
            {formulaText || statusNoteText ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                {formulaText ? (
                  <span className="font-bold text-[#514956]">
                    {formulaText}
                  </span>
                ) : null}
                {formulaText && statusNoteText ? (
                  <span className="text-[#D8D0C5]">•</span>
                ) : null}
                {statusNoteText ? (
                  <span className="text-[11px] font-medium text-[#8C8479]">
                    {statusNoteText}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Rate Breakdown Items */}
          {item.mode === "HOME_VISIT" ? (
            <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
              <div className="flex justify-between">
                <span>{displayCopy.totalVisits}</span>
                <span className="font-extrabold text-[#2B231D]">
                  {displayCopy.totalVisitsCount(totalVisitsCount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>{displayCopy.careUnitPriceVisit}</span>
                <span suppressHydrationWarning className="font-extrabold text-[#2B231D]">
                  {careUnitPriceDisplay}
                </span>
              </div>

              <div className="flex justify-between">
                <span>{displayCopy.travelFeeVisit}</span>
                <span suppressHydrationWarning className="font-extrabold text-[#2D6A4F]">
                  {travelFeeDisplay}
                </span>
              </div>
            </div>
          ) : item.mode === "BOARDING" ? (
            <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
              <div className="flex justify-between">
                <span>{displayCopy.totalNights}</span>
                <span className="font-extrabold text-[#2B231D]">
                  {displayCopy.totalNightsCount(nightsTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{displayCopy.nightlyRate}</span>
                <span className="font-extrabold text-[#2B231D]">
                  {pricing.budgetKind === "OPEN"
                    ? displayCopy.discuss
                    : pricing.budgetKind === "RANGE" && pricing.unitMaxRateMinor
                    ? `${formatMoneyAmount(pricing.unitRateMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.unitMaxRateMinor, pricing.currency)}`
                    : `${formatMoneyAmount(pricing.unitRateMinor ?? 0, pricing.currency)}`}
                </span>
              </div>
              {item.source === "V2" && item.additionalCosts.length > 0
                ? item.additionalCosts
                    .filter((c) => {
                      if (c.mode === "NONE") return false;
                      if (c.kind === "TRAVEL") {
                        const transportMode =
                          item.schedule?.boarding?.transportMode;
                        const handoffDirection =
                          item.schedule?.boarding?.handoffDirection;
                        return (
                          transportMode === "PROVIDER" ||
                          handoffDirection === "SPLIT"
                        );
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      if (a.kind === "SUPPLY" && b.kind === "TRAVEL") return -1;
                      if (a.kind === "TRAVEL" && b.kind === "SUPPLY") return 1;
                      return 0;
                    })
                    .map((c, idx) => {
                      const isTravel = c.kind === "TRAVEL";
                      const label = isTravel
                        ? displayCopy.travelFee
                        : displayCopy.supplyFee;

                      const valueText =
                        c.mode === "FIXED" && c.amountMinor != null
                          ? `+${formatMoneyAmount(c.amountMinor, item.budget.currency)}`
                          : c.mode === "ACTUAL"
                            ? displayCopy.actualCost
                            : displayCopy.discuss;

                      return (
                        <div key={idx} className="flex justify-between">
                          <span>{label}</span>
                          <span className="font-extrabold text-[#2D6A4F]">
                            {valueText}
                          </span>
                        </div>
                      );
                    })
                : null}
            </div>
          ) : (
            <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
              <div className="flex justify-between">
                <span>{displayCopy.careServiceFee}</span>
                <span className="font-extrabold text-[#2B231D]">
                  {pricing.budgetKind === "OPEN"
                    ? displayCopy.discuss
                    : pricing.budgetKind === "RANGE" && pricing.estimatedTotalMaxMinor
                    ? `${formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoneyAmount(pricing.estimatedTotalMaxMinor, pricing.currency)}`
                    : formatMoneyAmount(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)}
                </span>
              </div>
              {item.source === "V2" && item.additionalCosts.length > 0
                ? item.additionalCosts
                    .filter((c) => c.mode !== "NONE")
                    .map((c, idx) => {
                      const isTravel = c.kind === "TRAVEL";
                      const label = isTravel ? displayCopy.travelFee : displayCopy.supplyFee;

                      const valueText =
                        c.mode === "FIXED" && c.amountMinor != null
                          ? `+${formatMoneyAmount(c.amountMinor, item.budget.currency)}`
                          : c.mode === "ACTUAL"
                          ? displayCopy.actualCost
                          : displayCopy.discuss;

                      return (
                        <div key={idx} className="flex justify-between">
                          <span>{label}</span>
                          <span className="font-extrabold text-[#2D6A4F]">{valueText}</span>
                        </div>
                      );
                    })
                : null}
            </div>
          )}
        </div>

        {/* 3. Action Buttons Section */}
        {!readOnly ? (
          <div className="space-y-2.5 pt-2 border-t border-[#F2EFE9]">
            {!isOwner ? (
              <button
                type="button"
                onClick={() => setDevModalType("apply")}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#5d35be] active:scale-[0.99] transition text-center cursor-pointer"
              >
                {displayCopy.apply}
              </button>
            ) : null}

            <div className="w-full">
              <FavoriteButton kind="NEED" publicId={publicId} returnTo={returnTo} />
            </div>
          </div>
        ) : null}

        {/* 4. Owner Info Section (Click opens under-development notice) */}
        <div
          onClick={() => setDevModalType("owner")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setDevModalType("owner");
            }
          }}
          className="pt-3.5 border-t border-[#F2EFE9] flex items-center justify-between gap-3 group transition rounded-2xl hover:bg-[#FAF8F5] -mx-2 px-2 py-1.5 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-purple-50 shadow-2xs group-hover:scale-105 transition-transform">
              {item.owner.image ? (
                <AppImage
                  src={item.owner.image}
                  alt={item.owner.nickname || copy.ownerFallback}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={18} className="m-auto mt-2 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-[#2B231D] text-sm leading-snug truncate group-hover:text-primary transition-colors">
                {item.owner.nickname || copy.ownerFallback}
              </p>
              <p className="text-[11px] text-[#8C8479]">
                {displayCopy.ownerRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#5F5850] shrink-0 bg-[#FAF8F5] group-hover:bg-white px-2.5 py-1 rounded-xl border border-[#EDE8E1] transition-colors">
            <PiFileText size={14} className="text-[#8C8479]" />
            <span>
              {displayCopy.requestsPublished(item.owner.requestsCount ?? 1)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Under Development Dialog Modal */}
      {devModalType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setDevModalType(null)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 text-center shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDevModalType(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100 text-primary shadow-xs">
              <Sparkles size={24} className="text-primary" />
            </div>

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-primary border border-purple-200/70">
              <Clock size={12} />
              <span>{modalText.badge}</span>
            </div>

            {/* Title */}
            <h3 className="mt-3 text-lg sm:text-xl font-black text-slate-900">
              {devModalType === "apply" ? modalText.applyTitle : modalText.ownerTitle}
            </h3>

            {/* Description */}
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600">
              {devModalType === "apply" ? modalText.applyDesc : modalText.ownerDesc}
            </p>

            {/* Confirm CTA */}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setDevModalType(null)}
                className="w-full sm:w-auto min-w-[140px] rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#5d35be] transition cursor-pointer"
              >
                {modalText.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
