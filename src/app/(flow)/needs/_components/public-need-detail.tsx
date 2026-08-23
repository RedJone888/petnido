"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DayPicker } from "react-day-picker";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Coins,
  Copy,
  Heart,
  Home,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Package,
  PawPrint,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import {
  PiBookOpen,
  PiCalendarBlank,
  PiCaretLeft,
  PiCaretRight,
  PiChatCircleDots,
  PiCheckCircle,
  PiClock,
  PiCurrencyCircleDollar,
  PiGenderFemale,
  PiGenderMale,
  PiHandHeart,
  PiHouseLine,
  PiListChecks,
  PiMapPin,
  PiPawPrint,
  PiShieldCheck,
  PiSuitcase,
  PiTag,
  PiWarehouse,
  PiFileText,
} from "react-icons/pi";

import MapLibreMap from "@/components/location/MapLibreMap";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { PendingActionLink } from "@/components/marketplace/pending-action-link";
import { AppImage } from "@/components/ui/app-image";
import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import type { RouterOutputs } from "@/server/trpc";
import { messages } from "@/i18n/messages";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";
import { localizePetBreed } from "@/domain/pet/profile-options";
import { localizeTaskLabel } from "@/modules/need-publishing/domain/task-catalog";
import {
  calculateNeedPricing,
  formatMoneyAmount,
  parseDateValue,
  inclusiveDayCount,
  calculateBoardingNights,
} from "@/domain/marketplace/need-pricing";
import { trpc } from "@/utils/trpc";
import cn from "@/lib/cn";
import { NeedDetailSkeleton } from "./need-detail-skeleton";
import { localizedNeedTitle } from "./need-card";

const modeBadgeThemes: Record<"HOME_VISIT" | "BOARDING" | "CUSTOM", string> = {
  HOME_VISIT: "bg-emerald-600 text-white shadow-emerald-950/20",
  BOARDING: "bg-amber-600 text-white shadow-amber-950/20",
  CUSTOM: "bg-violet-600 text-white shadow-violet-950/20",
};

function formatMoney(amountMinor: number, currency: string) {
  return formatMoneyAmount(amountMinor, currency);
}

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

function formatDateSpan(startsAt: Date | string, endsAt: Date | string, lang: Lang) {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end) return "";
  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  const startStr = start.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  return `${startStr}–${endStr}`;
}

function formatPublishedAt(date: Date | string | null | undefined, lang: Lang) {
  if (!date) return "";
  const d = parseDateValue(date);
  if (!d) return "";
  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

function formatHomeVisitFrequency(
  intervalDays: number,
  visitsPerDay: number,
  lang: Lang
): string {
  if (intervalDays === 1) {
    if (visitsPerDay === 1) {
      return lang === "zh"
        ? "每日上门 1 次"
        : lang === "ja"
        ? "毎日 1回訪問"
        : "1 visit daily";
    }
    return lang === "zh"
      ? `每日上门（每天 ${visitsPerDay} 次）`
      : lang === "ja"
      ? `毎日（1日${visitsPerDay}回）`
      : `Daily · ${visitsPerDay} visits/day`;
  }

  // intervalDays > 1 (e.g. 每3天)
  if (visitsPerDay === 1) {
    return lang === "zh"
      ? `每 ${intervalDays} 天上门 1 次`
      : lang === "ja"
      ? `${intervalDays}日ごとに1回訪問`
      : `Every ${intervalDays} days · 1 visit`;
  }

  return lang === "zh"
    ? `每 ${intervalDays} 天上门（当天 ${visitsPerDay} 次访问）`
    : lang === "ja"
    ? `${intervalDays}日ごと（訪問日に${visitsPerDay}回）`
    : `Every ${intervalDays} days · ${visitsPerDay} visits on service days`;
}

function chunkArray<T = any>(arr: any[] | readonly any[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push((arr as T[]).slice(i, i + size));
  }
  return chunks;
}

function customTimeLabel(
  preference: string | null | undefined,
  exactTime: string | null | undefined,
  t: (typeof messages)[Lang],
  needCopy: ReturnType<typeof getNeedPublishingMessages>,
) {
  if (!preference) {
    if (exactTime) return exactTime;
    return needCopy.needPublishing.timeOptions.flexible;
  }
  const key = preference.toLowerCase() as keyof typeof needCopy.needPublishing.timeOptions;
  const prefLabel = needCopy.needPublishing.timeOptions[key] ?? preference;
  if (preference.toUpperCase() === "EXACT") {
    return exactTime ? `${prefLabel} · ${exactTime}` : prefLabel;
  }
  if (exactTime) {
    return `${prefLabel} (${exactTime})`;
  }
  return prefLabel;
}

// Story generation logic producing natural, warm, human-centric community narratives
function buildNeedStoryText(
  item: any,
  lang: Lang,
  t: (typeof messages)[Lang],
) {
  const days = inclusiveDayCount(item.startsAt, item.endsAt);
  const nights = calculateBoardingNights(item.startsAt, item.endsAt);
  const dateStr = formatDateSpan(item.startsAt, item.endsAt, lang);
  const area = item.location.regionLabel || t.core.common.approximateArea;

  const intervalDays = item.schedule?.homeVisit?.intervalDays || 1;
  const visitsPerDay = item.schedule?.homeVisit?.visitsPerServiceDay || 1;
  const homeVisitFrequency = formatHomeVisitFrequency(intervalDays, visitsPerDay, lang);

  // Extract and select representative task labels (max 2-3 to avoid overwhelming lists)
  const rawTaskLabels = Array.from(
    new Set(
      (item.tasks || [])
        .map((taskItem: any) => taskItem.label?.trim())
        .filter((lbl: any): lbl is string => Boolean(lbl && lbl.length > 0))
    )
  );

  const maxTasksToShow = 3;
  const representativeTasks = rawTaskLabels.slice(0, maxTasksToShow);
  const hasMoreTasks = rawTaskLabels.length > maxTasksToShow;

  const taskListZh =
    representativeTasks.length > 0
      ? hasMoreTasks
        ? `，日常照护包括${representativeTasks.join("、")}等`
        : `，日常照护包括${representativeTasks.join("、")}`
      : "";

  const taskListJa =
    representativeTasks.length > 0
      ? hasMoreTasks
        ? `（日常のお世話：${representativeTasks.join("、")} など）`
        : `（日常のお世話：${representativeTasks.join("、")}）`
      : "";

  const taskListEn =
    representativeTasks.length > 0
      ? hasMoreTasks
        ? ` Routine care includes ${representativeTasks.join(", ")}, and other daily routines.`
        : ` Routine care includes ${
            representativeTasks.length === 1
              ? representativeTasks[0]
              : `${representativeTasks.slice(0, -1).join(", ")} and ${representativeTasks.at(-1)}`
          }.`
      : "";

  // Boarding dynamic parameters: distance, transport mode, supplies, and additional costs
  const boardingDetail = item.schedule?.boarding;
  const transportMode = boardingDetail?.transportMode;
  const maxDistanceMeters = boardingDetail?.maxProviderDistanceMeters;
  const maxDistanceKm = maxDistanceMeters && maxDistanceMeters > 0 ? Math.round(maxDistanceMeters / 1000) : null;

  const travelCost = (item.additionalCosts || []).find((c: any) => c.kind === "TRAVEL");
  const travelAmountFormatted =
    travelCost?.mode === "FIXED" && travelCost.amountMinor != null
      ? formatMoney(travelCost.amountMinor, item.budget.currency)
      : null;

  const supplyCost = (item.additionalCosts || []).find((c: any) => c.kind === "SUPPLY");
  const supplyAmountFormatted =
    supplyCost?.mode === "FIXED" && supplyCost.amountMinor != null
      ? formatMoney(supplyCost.amountMinor, item.budget.currency)
      : null;

  const supplies = item.supplies || [];
  const providerSupplies = supplies.filter((s: any) => s.providedBy === "PROVIDER");
  const ownerSupplies = supplies.filter((s: any) => s.providedBy === "OWNER");

  // Dynamic transport sentence based on actual need configuration
  let boardingTransportZh = "";
  let boardingTransportJa = "";
  let boardingTransportEn = "";

  if (item.mode === "BOARDING" && transportMode) {
    if (transportMode === "OWNER") {
      boardingTransportZh = "接送方面，将由饲主亲自负责往返接送。";
      boardingTransportJa = "送迎については、飼い主が直接送迎を行います。";
      boardingTransportEn = "As for transportation, the owner will handle drop-off and pickup.";
    } else if (transportMode === "PROVIDER") {
      if (travelCost?.mode === "FIXED" && travelAmountFormatted) {
        boardingTransportZh = `接送方面，希望由寄养家庭协助负责接送，我们将提供固定交通补贴 ${travelAmountFormatted}。`;
        boardingTransportJa = `送迎については、ホストの方にお願いしたく、固定交通費として ${travelAmountFormatted} を支給いたします。`;
        boardingTransportEn = `We would like the host to handle pickup and return, and we offer a fixed travel allowance of ${travelAmountFormatted}.`;
      } else if (travelCost?.mode === "ACTUAL") {
        boardingTransportZh = "接送方面，希望由寄养家庭协助负责接送，实际产生的交通费用将实报实销。";
        boardingTransportJa = "送迎については、ホストの方にお願いしたく、発生した実費交通費を全額精算（実費支給）いたします。";
        boardingTransportEn = "We would like the host to handle pickup and return, and actual travel expenses will be fully reimbursed.";
      } else if (travelCost?.mode === "DISCUSS") {
        boardingTransportZh = "接送方面，希望由寄养家庭协助负责接送，具体交通费用可进一步沟通协商。";
        boardingTransportJa = "送迎については、ホストの方にお願いしたく、交通費の詳細はご相談の上決定させていただきます。";
        boardingTransportEn = "We would like the host to handle pickup and return, with travel expenses open for discussion.";
      } else {
        boardingTransportZh = "接送方面，希望由寄养家庭协助负责往返接送。";
        boardingTransportJa = "送迎については、ホストファミリー様による送迎を希望しております。";
        boardingTransportEn = "We are looking for a host who can assist with pet pickup and return.";
      }
    } else if (transportMode === "TAXI") {
      boardingTransportZh = "接送方面，我们计划安排宠物专车进行往返接送。";
      boardingTransportJa = "送迎については、ペット専用タクシー等の手配を予定しています。";
      boardingTransportEn = "We plan to arrange pet taxi or dedicated transportation.";
    } else if (transportMode === "DISCUSS") {
      boardingTransportZh = "接送方式及相关交通费用双方可进一步沟通协商。";
      boardingTransportJa = "送迎方法および交通費については、ご相談の上で決定できれば幸いです。";
      boardingTransportEn = "Transportation arrangements and any travel costs can be coordinated and discussed together.";
    }
  }

  // Dynamic supply sentence based on actual need configuration
  let boardingSupplyZh = "";
  let boardingSupplyJa = "";
  let boardingSupplyEn = "";

  if (item.mode === "BOARDING") {
    if (providerSupplies.length > 0) {
      const pNames = providerSupplies.map((s: any) => s.label).filter(Boolean);
      const pPreviewZh = pNames.slice(0, 3).join("、");
      const pPreviewJa = pNames.slice(0, 3).join("、");
      const pPreviewEn = pNames.slice(0, 3).join(", ");

      if (supplyCost?.mode === "FIXED" && supplyAmountFormatted) {
        boardingSupplyZh = `物品方面，需要寄养家庭协助提供${pPreviewZh ? ` ${pPreviewZh} 等` : "部分"}物资，我们将提供固定物资补贴 ${supplyAmountFormatted}。`;
        boardingSupplyJa = `用品については、ホスト側に${pPreviewJa ? `${pPreviewJa}などの` : "一部の"}ご用意をお願いしたく、固定用品費として ${supplyAmountFormatted} を支給いたします。`;
        boardingSupplyEn = `For supplies, we will need the host to provide ${pPreviewEn ? `items such as ${pPreviewEn}` : "certain essentials"}, and we provide a fixed supply allowance of ${supplyAmountFormatted}.`;
      } else if (supplyCost?.mode === "ACTUAL") {
        boardingSupplyZh = `物品方面，需要寄养家庭协助提供${pPreviewZh ? ` ${pPreviewZh} 等` : "部分"}物资，相关用品费用将实报实销。`;
        boardingSupplyJa = `用品については、ホスト側に${pPreviewJa ? `${pPreviewJa}などの` : "一部の"}ご用意をお願いしたく、購入にかかる実費は全額精算いたします。`;
        boardingSupplyEn = `For supplies, we will need the host to provide ${pPreviewEn ? `items such as ${pPreviewEn}` : "certain essentials"}, and actual supply expenses will be reimbursed.`;
      } else {
        boardingSupplyZh = `物品方面，需要寄养家庭协助提供${pPreviewZh ? ` ${pPreviewZh} 等` : "部分"}物资，相关费用双方沟通协商。`;
        boardingSupplyJa = `用品については、ホスト側に${pPreviewJa ? `${pPreviewJa}などの` : "一部の"}ご用意をお願いしたく、費用についてはご相談させてください。`;
        boardingSupplyEn = `For supplies, we will need the host to provide ${pPreviewEn ? `items such as ${pPreviewEn}` : "certain essentials"}, with supply costs open for discussion.`;
      }
    } else if (ownerSupplies.length > 0) {
      const oNames = ownerSupplies.map((s: any) => s.label).filter(Boolean);
      const oPreviewZh = oNames.slice(0, 3).join("、");
      const oPreviewJa = oNames.slice(0, 3).join("、");
      const oPreviewEn = oNames.slice(0, 3).join(", ");
      boardingSupplyZh = `物资方面，我们将备齐${oPreviewZh ? ` ${oPreviewZh} 等` : ""}宠物熟悉的口粮与日常必需品，让毛孩子安心适应新环境。`;
      boardingSupplyJa = `用品については、${oPreviewJa ? `${oPreviewJa}など` : ""}普段使い慣れたフードや日用品を一式持参いたしますのでご安心ください。`;
      boardingSupplyEn = `We will provide their familiar food and daily essentials${oPreviewEn ? ` (${oPreviewEn})` : ""} so they feel right at home.`;
    } else {
      boardingSupplyZh = "我们会备齐宠物熟悉的口粮与日常必需品，确保毛孩子能平稳适应。";
      boardingSupplyJa = "愛用グッズやフードはしっかり準備いたしますので、ご安心ください。";
      boardingSupplyEn = "We'll provide their familiar food and daily essentials so they feel right at home.";
    }
  }

  // Format pets summary nicely by language
  const petParts = (item.pets || []).map((p: any) => {
    const typeLabel = t.core.pets[p.petType as keyof typeof t.core.pets] ?? p.petType;
    if (lang === "zh") {
      return p.name ? `${p.name}（${typeLabel}）` : `${p.quantity || 1} 只${typeLabel}`;
    }
    if (lang === "ja") {
      return p.name ? `${p.name}（${typeLabel}）` : `${typeLabel}`;
    }
    return p.name ? `${p.name} (${typeLabel})` : `${p.quantity || 1} ${typeLabel}`;
  });

  const petsSummary =
    lang === "zh"
      ? petParts.join("、")
      : lang === "ja"
      ? petParts.join("、")
      : petParts.length <= 1
      ? petParts[0] || "our pets"
      : `${petParts.slice(0, -1).join(", ")} and ${petParts.at(-1)}`;

  // If owner provided genuine non-template custom description, use it
  const desc = item.description?.trim();
  if (
    desc &&
    !desc.startsWith("I need a sitter") &&
    !desc.startsWith("I’ll be away") &&
    !desc.startsWith("I'll be away") &&
    !desc.startsWith("I’m looking for help") &&
    !desc.startsWith("I'm looking for help")
  ) {
    return desc;
  }

  // Synthesized natural, warm story based on mode and language
  if (lang === "zh") {
    if (item.mode === "HOME_VISIT") {
      return `我们在 ${dateStr} 期间需要外出，希望能寻找一位细心、有爱心且可靠的服务者到家中提供上门照护，照顾 ${petsSummary}。上门安排为${homeVisitFrequency}${taskListZh}。具体的上门时间点与详细事项已在下方列出，期待与有经验的服务者联系！`;
    }
    if (item.mode === "BOARDING") {
      const locationIntro = maxDistanceKm
        ? `我们在 ${dateStr}（共 ${nights} 晚）期间需要离家外出，希望能为 ${petsSummary} 寻找距离 ${area} ${maxDistanceKm} 公里以内的温馨寄养家庭。`
        : `我们在 ${dateStr}（共 ${nights} 晚）期间需要离家外出，希望能为 ${petsSummary} 寻找位于 ${area} 及周边的温馨寄养家庭。`;

      const detailsList = [boardingTransportZh, boardingSupplyZh].filter(Boolean).join(" ");
      return `${locationIntro}${taskListZh ? `日常照护主要包括${representativeTasks.join("、")}等。` : ""} ${detailsList} 详细的日常照护任务已在下方完整列出，期待与合适的服务者联系！`;
    }
    return `我们在 ${dateStr} 期间需要为 ${petsSummary} 寻找贴心的照料协助${taskListZh}。这是一项定制照护需求，涵盖专属的任务与时间安排。请在申请前查看下方具体的照护要求、服务位置与注意事项，期待您的应聘！`;
  }

  if (lang === "ja") {
    if (item.mode === "HOME_VISIT") {
      return `${dateStr} の留守中、自宅を訪問して大切なペット（${petsSummary}）のお世話をしてくださる親切で信頼できるシッターさんを募集しています。訪問頻度は${homeVisitFrequency}です${taskListJa}。詳しいスケジュールやお願いしたい作業は下記をご確認ください。ご応募をお待ちしております！`;
    }
    if (item.mode === "BOARDING") {
      const locationIntro = maxDistanceKm
        ? `${dateStr}（全 ${nights} 泊）の外出に伴い、${area} から ${maxDistanceKm}km 以内にある安心できるホストファミリーを ${petsSummary} のために探しています。`
        : `${dateStr}（全 ${nights} 泊）の外出に伴い、${area} 周辺で ${petsSummary} を大切に預かってくださる安心できるホストファミリーを探しています。`;

      const detailsList = [boardingTransportJa, boardingSupplyJa].filter(Boolean).join(" ");
      return `${locationIntro}${taskListJa ? `日常のお世話として${representativeTasks.join("、")}などが含まれます。` : ""} ${detailsList} 詳しいお世話ルーティンや条件は下記をご確認の上、ぜひご連絡をお待ちしております！`;
    }
    return `${dateStr} の期間、${petsSummary} のお世話をサポートしてくださる方を募集しています${taskListJa}。こちらはカスタム照護リクエストとなっておりますので、詳しい作業内容や条件を下記でご確認の上、お気軽にご応募ください。`;
  }

  // English default
  if (item.mode === "HOME_VISIT") {
    return `We're heading out of town between ${dateStr} and are looking for a gentle, trustworthy sitter to visit our home and care for ${petsSummary}. The schedule is set for ${homeVisitFrequency}.${taskListEn} Please check out the visit times and detailed tasks below—we look forward to hearing from you!`;
  }
  if (item.mode === "BOARDING") {
    const locationIntro = maxDistanceKm
      ? `We will be away for ${nights} ${nights === 1 ? "night" : "nights"} (${dateStr}) and are seeking a warm, loving, and attentive boarding home within ${maxDistanceKm} km of ${area} for ${petsSummary}.`
      : `We will be away for ${nights} ${nights === 1 ? "night" : "nights"} (${dateStr}) and are seeking a warm, loving, and attentive boarding home in or around ${area} for ${petsSummary}.`;

    const detailsList = [boardingTransportEn, boardingSupplyEn].filter(Boolean).join(" ");
    return `${locationIntro}${taskListEn} ${detailsList} Please review the care routines and details below—we would love to hear from you!`;
  }
  return `We are looking for thoughtful and reliable care assistance for ${petsSummary} between ${dateStr}.${taskListEn} This is a tailored care request; please review the specific tasks, location, and requirements below before applying.`;
}

function formatPetAge(
  birthDate: string | Date | null | undefined,
  t: (typeof messages)[Lang]
) {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  const bornYear = born.getUTCFullYear();
  const bornMonth = born.getUTCMonth();
  const bornDay = born.getUTCDate();
  const days = Math.max(
    0,
    Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(bornYear, bornMonth, bornDay)) /
        86_400_000,
    ),
  );
  let months = (today.getFullYear() - bornYear) * 12 + today.getMonth() - bornMonth;
  if (today.getDate() < bornDay) months -= 1;
  const copy = t.settings.pets;
  if (months < 1) {
    return (days === 1 ? copy.ageDay : copy.ageDays).replace("{count}", String(days));
  }
  if (months < 12) {
    return (months === 1 ? copy.ageMonth : copy.ageMonths).replace("{count}", String(months));
  }
  let years = today.getFullYear() - bornYear;
  if (
    today.getMonth() < bornMonth ||
    (today.getMonth() === bornMonth && today.getDate() < bornDay)
  ) {
    years -= 1;
  }
  const count = Math.max(1, years);
  return (count === 1 ? copy.ageYear : copy.ageSummary).replace("{age}", String(count)).replace("{count}", String(count));
}

function formatPetGenderAndNeuter(
  sex: string | null | undefined,
  neutered: string | null | undefined,
  lang: Lang,
  t: (typeof messages)[Lang]
) {
  const normSex = sex?.toUpperCase();
  const normNeutered = neutered?.toUpperCase();

  if (!normSex && !normNeutered) return null;

  let genderKind: "MALE" | "FEMALE" | "OTHER" = "OTHER";
  if (normSex === "MALE") genderKind = "MALE";
  else if (normSex === "FEMALE") genderKind = "FEMALE";

  let sexLabel = "";
  if (genderKind === "MALE") {
    sexLabel = lang === "zh" ? "公" : lang === "ja" ? "オス" : "Male";
  } else if (genderKind === "FEMALE") {
    sexLabel = lang === "zh" ? "母" : lang === "ja" ? "メス" : "Female";
  }

  let neuteredLabel = "";
  if (normNeutered === "YES") {
    if (genderKind === "FEMALE") {
      neuteredLabel = lang === "zh" ? "已绝育" : lang === "ja" ? "避妊済" : "Spayed";
    } else if (genderKind === "MALE") {
      neuteredLabel = lang === "zh" ? "已绝育" : lang === "ja" ? "去勢済" : "Neutered";
    } else {
      neuteredLabel = lang === "zh" ? "已绝育" : lang === "ja" ? "避妊・去勢済" : "Neutered/Spayed";
    }
  } else if (normNeutered === "NO") {
    if (genderKind === "FEMALE") {
      neuteredLabel = lang === "zh" ? "未绝育" : lang === "ja" ? "未避妊" : "Not spayed";
    } else if (genderKind === "MALE") {
      neuteredLabel = lang === "zh" ? "未绝育" : lang === "ja" ? "未去勢" : "Not neutered";
    } else {
      neuteredLabel = lang === "zh" ? "未绝育" : lang === "ja" ? "未去勢・未避妊" : "Not neutered";
    }
  }

  const parts = [sexLabel, neuteredLabel].filter(Boolean);
  if (parts.length === 0) return null;

  return {
    label: parts.join(" · "),
    genderKind,
  };
}

function formatPetWeight(weightGrams: number | null | undefined, lang: Lang) {
  if (!weightGrams || weightGrams <= 0) return null;
  if (weightGrams < 1000) {
    return `${weightGrams} g`;
  }
  const kg = weightGrams / 1000;
  const formatted = new Intl.NumberFormat(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US", {
    maximumFractionDigits: 1,
  }).format(kg);
  return `${formatted} kg`;
}

function taskPriorityInfo(priority: string | null | undefined, lang: Lang) {
  if (priority === "MUST") {
    return {
      text: lang === "zh" ? "必做" : lang === "ja" ? "必須" : "Must do",
      className: "bg-amber-50 border-amber-200/90 text-amber-900 font-bold",
    };
  }
  if (priority === "NICE") {
    return {
      text: lang === "zh" ? "尽可能做" : lang === "ja" ? "できれば" : "If possible",
      className: "bg-slate-50 border-slate-200 text-slate-600 font-medium",
    };
  }
  return null;
}

function taskScheduleKindInfo(kind: string | null | undefined, lang: Lang, mode?: string) {
  const effectiveKind = kind || (mode === "BOARDING" ? "DAILY" : null);
  switch (effectiveKind) {
    case "EACH_VISIT":
      return {
        text: lang === "zh" ? "每次上门" : lang === "ja" ? "毎回" : "Each visit",
        className: "bg-purple-50 border-purple-200/80 text-primary",
      };
    case "DAILY":
      return {
        text: lang === "zh" ? "每日" : lang === "ja" ? "毎日" : "Daily",
        className: "bg-blue-50 border-blue-200/80 text-blue-700",
      };
    case "REPEATING":
      return {
        text: lang === "zh" ? "定期" : lang === "ja" ? "定期" : "Regular",
        className: "bg-indigo-50 border-indigo-200/80 text-indigo-700",
      };
    case "ONCE":
      return {
        text: lang === "zh" ? "仅一次" : lang === "ja" ? "1回のみ" : "Once",
        className: "bg-amber-50 border-amber-200/80 text-amber-800",
      };
    case "AS_NEEDED":
      return {
        text: lang === "zh" ? "按需" : lang === "ja" ? "必要時" : "As needed",
        className: "bg-teal-50 border-teal-200/80 text-teal-800",
      };
    default:
      return null;
  }
}

function formatTransportModeLabel(mode: string | null | undefined, lang: Lang) {
  switch (mode) {
    case "OWNER":
      return lang === "zh" ? "饲主亲自接送" : lang === "ja" ? "飼い主が直接送迎" : "Owner drop-off & pick-up";
    case "PROVIDER":
      return lang === "zh" ? "寄养方提供接送" : lang === "ja" ? "ホストによる送迎" : "Host provides transport";
    case "TAXI":
      return lang === "zh" ? "宠物专车/第三方" : lang === "ja" ? "ペットタクシー" : "Pet taxi";
    case "DISCUSS":
      return lang === "zh" ? "沟通协商" : lang === "ja" ? "相談して決定" : "To be discussed";
    default:
      return mode || "-";
  }
}

function TaskItemCard({
  task,
  lang,
  t,
}: {
  task: {
    category?: string;
    label: string;
    instructions?: string | null;
    priority?: string;
    scheduleKind?: string;
    visitNumbers?: number[];
    pets?: Array<{ name: string | null; petType: string }>;
  };
  lang: Lang;
  t: (typeof messages)[Lang];
}) {
  const priority = taskPriorityInfo(task.priority, lang);
  const schedule = taskScheduleKindInfo(task.scheduleKind, lang);
  const category = task.category ?? "";
  const upperCategory = category.toUpperCase();
  const taskLabel = localizeTaskLabel(task.label, lang, {
    category,
    custom: upperCategory === "CUSTOM" || upperCategory.startsWith("CUSTOM-"),
  });

  return (
    <div className="rounded-xl border border-[#EDE8E1] bg-[#FAF8F5]/90 p-3 sm:p-3.5 transition hover:bg-white hover:shadow-2xs">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 size={16} className="text-[#2D6A4F] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-sm text-[#2B231D]">
              {taskLabel}
            </span>

            {priority ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                  priority.className
                )}
              >
                {priority.text}
              </span>
            ) : null}

            {schedule ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                  schedule.className
                )}
              >
                {schedule.text}
              </span>
            ) : null}

            {task.pets && task.pets.length > 0
              ? task.pets.map((p, pIdx) => {
                  const pName = p.name || t.core.pets[p.petType as keyof typeof t.core.pets] || p.petType;
                  return (
                    <span
                      key={pIdx}
                      className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200/90 px-2 py-0.5 text-[10px] font-semibold text-stone-700"
                    >
                      <PiPawPrint className="h-3 w-3 text-stone-500 shrink-0" />
                      <span>{pName}</span>
                    </span>
                  );
                })
              : null}
          </div>

          {task.instructions ? (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#FAF6F0] border border-[#EFE7DC] px-2.5 py-1.5 text-xs text-[#514956]">
              <PiChatCircleDots size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed whitespace-pre-wrap">{task.instructions}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
function deduplicateTasks<
  T extends {
    label: string;
    instructions?: string | null;
    priority?: string | null;
    scheduleKind?: string | null;
  }
>(tasks: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const task of tasks) {
    const labelKey = task.label.trim().toLowerCase();
    const instKey = (task.instructions || "").trim();
    const prioKey = task.priority || "";
    const schedKey = task.scheduleKind || "";
    const key = `${labelKey}|${instKey}|${prioKey}|${schedKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(task);
    }
  }

  return unique;
}

function formatVisitWindowTime(
  window: { kind: string; preferredLocalTime: string | null } | undefined,
  lang: Lang,
  t: (typeof messages)[Lang],
  needCopy: ReturnType<typeof getNeedPublishingMessages>,
) {
  if (!window || window.kind === "FLEXIBLE" || !window.preferredLocalTime) {
    return needCopy.needPublishing.timeOptions.flexible;
  }

  const time = window.preferredLocalTime.toLowerCase();
  const timeLabels = needCopy.needPublishing.timeOptions;

  if (time === "morning") return timeLabels.morning;
  if (time === "midday") return timeLabels.midday;
  if (time === "afternoon") return timeLabels.afternoon;
  if (time === "evening") return timeLabels.evening;
  if (time === "bedtime") return timeLabels.bedtime;
  if (time === "flexible") return timeLabels.flexible;

  return window.preferredLocalTime;
}

function groupPetsAndTasks(
  pets: Array<{
    name: string | null;
    petType: string;
    quantity: number;
    breed?: string | null;
    birthDate?: string | null;
    weightGrams?: number | null;
    sex?: string | null;
    neutered?: string | null;
    careNotes?: string | null;
    image?: string | null;
  }>,
  tasks: Array<{
    category: string;
    label: string;
    instructions?: string | null;
    priority?: string | null;
    scheduleKind?: string | null;
    visitNumbers?: number[];
    pets?: Array<{ name: string | null; petType: string }>;
  }>,
  lang: Lang,
  t: (typeof messages)[Lang]
) {
  if (!tasks.length) {
    return [];
  }

  if (!pets.length) {
    return [
      {
        key: "default",
        petType: "PET",
        groupTitle:
          lang === "zh"
            ? "照护任务"
            : lang === "ja"
            ? "お世話タスク"
            : "Care tasks",
        petTypeLabel:
          lang === "zh" ? "宠物" : lang === "ja" ? "ペット" : "Pet",
        pets: [],
        tasks: deduplicateTasks(tasks),
      },
    ];
  }

  // Group tasks by their exact matching set of bound pets
  const groupsMap = new Map<
    string,
    {
      key: string;
      petType: string;
      groupTitle: string;
      petTypeLabel: string;
      pets: typeof pets;
      tasks: typeof tasks;
    }
  >();

  for (const task of tasks) {
    let matchingPets: typeof pets;

    if (!task.pets || task.pets.length === 0) {
      matchingPets = pets;
    } else {
      matchingPets = pets.filter((pet) =>
        task.pets?.some((tp) => {
          if (tp.name && pet.name) {
            return (
              tp.name.trim().toLowerCase() === pet.name.trim().toLowerCase()
            );
          }
          if (tp.petType && pet.petType) {
            return tp.petType.toUpperCase() === pet.petType.toUpperCase();
          }
          return false;
        })
      );
      if (!matchingPets.length) {
        matchingPets = pets;
      }
    }

    const groupKey = matchingPets
      .map((p) => `${p.name?.trim().toLowerCase() || ""}::${p.petType}`)
      .sort()
      .join("|");

    const existing = groupsMap.get(groupKey);
    if (existing) {
      existing.tasks.push(task);
    } else {
      const firstPet = matchingPets[0];
      const petTypeLabel = firstPet
        ? t.core.pets[firstPet.petType.toLowerCase() as keyof typeof t.core.pets] ??
          t.core.pets[firstPet.petType as keyof typeof t.core.pets] ??
          firstPet.petType
        : "Pet";

      const groupTitle =
        matchingPets.length === pets.length && pets.length > 1
          ? lang === "zh"
            ? "共同任务"
            : lang === "ja"
            ? "共通タスク"
            : "Common Tasks"
          : matchingPets
              .map((p) => p.name || petTypeLabel)
              .filter(Boolean)
              .join(" & ");

      groupsMap.set(groupKey, {
        key: groupKey,
        petType: firstPet?.petType || "PET",
        groupTitle,
        petTypeLabel,
        pets: matchingPets,
        tasks: [task],
      });
    }
  }

  return Array.from(groupsMap.values()).map((group) => ({
    ...group,
    tasks: deduplicateTasks(group.tasks),
  }));
}

function customScheduleSummaryBadge(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  timePreference: string | null | undefined,
  exactTime: string | null | undefined,
  lang: Lang,
  t: (typeof messages)[Lang],
  needCopy: ReturnType<typeof getNeedPublishingMessages>,
) {
  if (!startDate || !endDate) return "";
  const dateStr = formatDateSpan(startDate, endDate, lang);
  const timeStr = customTimeLabel(timePreference, exactTime, t, needCopy);

  const isSameDay =
    new Date(startDate).toDateString() === new Date(endDate).toDateString();

  if (lang === "zh") {
    if (isSameDay) {
      return `${dateStr} · 偏好时间：${timeStr}`;
    }
    return `${dateStr} 期间任选 1 天 · 偏好时间：${timeStr}`;
  }

  if (lang === "ja") {
    if (isSameDay) {
      return `${dateStr} · 希望時間帯：${timeStr}`;
    }
    return `${dateStr} のうち任意の1日 · 希望時間帯：${timeStr}`;
  }

  // en
  if (isSameDay) {
    return `${dateStr} · Timing: ${timeStr}`;
  }
  return `Any 1 day within ${dateStr} · Timing: ${timeStr}`;
}

function PetGroupTaskDirectLayout({
  group,
  lang,
  t,
  mode,
}: {
  group: ReturnType<typeof groupPetsAndTasks>[number];
  lang: Lang;
  t: (typeof messages)[Lang];
  mode?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
      {/* Left side: Pet Avatar(s) & Name(s) in compact fixed column */}
      <div className="w-full sm:w-[130px] md:w-[140px] shrink-0 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-center pt-0.5">
        {group.pets.length > 0 ? (
          group.pets.map((pet, pIdx) => {
            const petName = pet.name || `${group.petTypeLabel} #${pIdx + 1}`;
            return (
              <div key={pIdx} className="flex flex-col items-center text-center shrink-0">
                <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-[#FFF8E8] shadow-2xs">
                  {pet.image ? (
                    <AppImage
                      src={pet.image}
                      alt={petName}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="block h-full w-full bg-[#fff8e8] bg-no-repeat"
                      style={{
                        backgroundImage: "url('/images/pet-default-avatars-v2.png')",
                        backgroundPosition: petAvatarPosition(pet.petType),
                        backgroundSize: "400% auto",
                      }}
                    />
                  )}
                </div>
                <p
                  className="mt-1 font-bold text-xs text-[#2B231D] text-center max-w-[76px] truncate"
                  title={petName}
                >
                  {petName}
                </p>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[var(--primary-fixed)] text-primary">
              <PiPawPrint size={20} />
            </div>
            <span className="mt-1 font-bold text-xs text-[#2B231D] text-center max-w-[76px] truncate">
              {group.groupTitle}
            </span>
          </div>
        )}
      </div>

      {/* Middle Vertical Divider */}
      <div className="hidden sm:block w-px bg-[#EDE8E1] self-stretch my-0.5" />
      <div className="sm:hidden h-px bg-[#EDE8E1] w-full" />

      {/* Right side: Tasks with 任务名, Frequency, 备注 */}
      <div className="flex-1 min-w-0 space-y-2.5">
        {group.tasks.length > 0 ? (
          group.tasks.map((task, idx) => {
            const priority = mode !== "CUSTOM" ? taskPriorityInfo(task.priority, lang) : null;
            const schedule = taskScheduleKindInfo(task.scheduleKind, lang, mode);

            return (
              <div
                key={idx}
                className="rounded-xl border border-[#EDE8E1]/80 bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] p-3 transition"
              >
                {/* 1. Header: Bullet Icon + 任务名 + Frequency + Priority */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <Circle size={14} className="text-primary stroke-[2.4] shrink-0" />
                  <span className="font-bold text-sm text-[#2B231D] leading-snug">
                    {localizeTaskLabel(task.label, lang, {
                      category: task.category,
                      custom:
                        task.category.toUpperCase() === "CUSTOM" ||
                        task.category.toUpperCase().startsWith("CUSTOM-"),
                    })}
                  </span>

                  {/* 2. Frequency (频率) */}
                  {schedule ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
                        schedule.className
                      )}
                    >
                      {schedule.text}
                    </span>
                  ) : null}

                  {/* Priority */}
                  {priority ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none",
                        priority.className
                      )}
                    >
                      {priority.text}
                    </span>
                  ) : null}
                </div>

                {/* 3. 备注 (Instructions / Notes) */}
                {task.instructions ? (
                  <div className="mt-2 ml-5 flex items-start gap-1.5 rounded-lg bg-white border border-[#EFE7DC] px-2.5 py-1.5 text-xs text-[#514956]">
                    <PiChatCircleDots size={14} className="text-primary shrink-0 mt-0.5" />
                    <div className="leading-relaxed whitespace-pre-wrap">
                      <span className="font-bold text-[#8C8479] mr-1">
                        {lang === "zh" ? "备注:" : lang === "ja" ? "備考:" : "Note:"}
                      </span>
                      {task.instructions}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-[#8C8479] italic py-2">
            {lang === "zh" ? "该宠物组暂无特定照护任务" : "No specific care tasks for this group"}
          </p>
        )}
      </div>
    </div>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateValue(date: Date) {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildVisitScheduleDates(
  startsAt: Date | string,
  endsAt: Date | string,
  frequency: string = "EVERY_DAY",
  customInterval: number = 1
) {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end || start > end) return [];

  const interval =
    frequency === "EVERY_TWO_DAYS" || frequency === "every-2-days"
      ? 2
      : frequency === "EVERY_THREE_DAYS" || frequency === "every-3-days"
      ? 3
      : frequency === "CUSTOM_INTERVAL" || frequency === "custom"
      ? Math.max(1, customInterval || 1)
      : 1;

  const result: string[] = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 3660) {
    result.push(toDateValue(cursor));
    cursor.setDate(cursor.getDate() + interval);
    guard += 1;
  }
  return result;
}

type NeedDetailDTO = RouterOutputs["marketplaceNeed"]["get"];

// Mode-specific visual calendar matching /needs/create dates step
function NeedCalendarView({
  item,
  lang,
}: {
  item: NeedDetailDTO;
  lang: Lang;
}) {
  const startDate = parseDateValue(item.startsAt);
  const endDate = parseDateValue(item.endsAt);
  const needCopy = getNeedPublishingMessages(lang);
  const startMonth = startDate ? startOfMonth(startDate) : undefined;
  const endMonth = endDate ? startOfMonth(endDate) : undefined;

  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(startDate ?? new Date())
  );

  useEffect(() => {
    const nextStartDate = parseDateValue(item.startsAt);
    if (nextStartDate) setCalendarMonth(startOfMonth(nextStartDate));
  }, [item.startsAt]);

  const isSingleMonth = Boolean(
    startMonth && endMonth && startMonth.getTime() === endMonth.getTime()
  );
  const canGoPrevious = Boolean(startMonth && calendarMonth > startMonth);
  const canGoNext = Boolean(endMonth && calendarMonth < endMonth);

  const changeMonth = (offset: number) => {
    const next = startOfMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1)
    );
    if (startMonth && next < startMonth) return setCalendarMonth(startMonth);
    if (endMonth && next > endMonth) return setCalendarMonth(endMonth);
    setCalendarMonth(next);
  };

  const t = messages[lang] ?? messages.en;
  const monthFormatted = calendarMonth.toLocaleDateString(
    lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  // Month navigation header (shared across modes)
  const MonthNavHeader = (
    <div className="flex min-h-8 items-center justify-between pb-1.5 mb-0.5">
      {isSingleMonth ? (
        <span className="h-7 w-7" aria-hidden="true" />
      ) : (
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoPrevious}
          onClick={() => changeMonth(-1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#514956] transition hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-25"
        >
          <PiCaretLeft size={18} />
        </button>
      )}
      <p className="text-xs sm:text-sm font-bold text-[#514956]">{monthFormatted}</p>
      {isSingleMonth ? (
        <span className="h-7 w-7" aria-hidden="true" />
      ) : (
        <button
          type="button"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => changeMonth(1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#514956] transition hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] disabled:pointer-events-none disabled:opacity-25"
        >
          <PiCaretRight size={18} />
        </button>
      )}
    </div>
  );

  // 1. BOARDING (家庭寄养: 连续住宿范围高亮)
  if (item.mode === "BOARDING") {
    return (
      <div className="w-full">
        {MonthNavHeader}
        <DayPicker
          key={`boarding-${item.startsAt}:${item.endsAt}`}
          mode="range"
          month={calendarMonth}
          selected={startDate && endDate ? { from: startDate, to: endDate } : undefined}
          showOutsideDays
          fixedWeeks
          hideNavigation
          components={{
            DayButton: ({ day, modifiers, className, ...props }) => {
              const isStart = modifiers.range_start;
              const isEnd = modifiers.range_end;
              const isMiddle = modifiers.range_middle;
              const inRange = isStart || isMiddle || isEnd;
              return (
                <button
                  {...props}
                  tabIndex={-1}
                  className={cn(
                    className,
                    "pointer-events-none relative mx-0 h-7 w-full rounded-none text-xs",
                    modifiers.outside ? "text-[#c8c3c9]" : "text-[#514956]"
                  )}
                >
                  {inRange && !(isStart && isEnd) ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-1",
                        modifiers.outside ? "bg-[#f3edf6]" : "bg-[#e8d9f0]",
                        isStart && "left-1/2 right-0 rounded-l-full",
                        isMiddle && "left-0 right-0",
                        isEnd && "left-0 right-1/2 rounded-r-full"
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mx-auto grid h-6.5 w-6.5 place-items-center rounded-full",
                      (isStart || isEnd) && !modifiers.outside && "bg-[var(--primary)] font-extrabold text-white shadow-sm",
                      (isStart || isEnd) && modifiers.outside && "bg-[#cbbbd4] font-extrabold text-white",
                      isMiddle && !modifiers.outside && "font-bold text-[#5d3a70]",
                      isMiddle && modifiers.outside && "font-bold text-[#b4a5bb]"
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                </button>
              );
            },
          }}
          classNames={{
            root: "w-full overflow-hidden pb-0",
            months: "w-full",
            month: "w-full",
            month_grid: "w-full table-fixed",
            day: "h-8 p-0 text-center",
            day_button: "w-full",
            weekday: "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
            month_caption: "hidden",
          }}
        />
        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#817a85] px-2">
          <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
          <span>{lang === "zh" ? "寄养日程" : lang === "ja" ? "宿泊日程" : "Boarding stay"}</span>
        </div>
      </div>
    );
  }

  // 2. HOME_VISIT (上门照护: 计划上门排班点位)
  if (item.mode === "HOME_VISIT") {
    const customInterval = item.schedule?.homeVisit?.intervalDays || 1;
    const plannedDates = buildVisitScheduleDates(item.startsAt, item.endsAt, "custom", customInterval);
    const candidateDateSet = new Set(plannedDates);

    return (
      <div className="w-full">
        {MonthNavHeader}
        <DayPicker
          key={`visit-${item.startsAt}:${item.endsAt}`}
          mode="single"
          month={calendarMonth}
          showOutsideDays
          fixedWeeks
          startMonth={startMonth}
          endMonth={endMonth}
          hideNavigation
          disabled={startDate && endDate ? [{ before: startDate }, { after: endDate }] : () => true}
          components={{
            DayButton: ({ day, modifiers, className, ...props }) => {
              const dateStr = toDateValue(day.date);
              const isPlanned = candidateDateSet.has(dateStr);
              const isInRequestRange = Boolean(startDate && endDate && day.date >= startDate && day.date <= endDate);
              return (
                <button
                  {...props}
                  tabIndex={-1}
                  className={cn(
                    className,
                    "pointer-events-none h-7 w-7 rounded-full text-xs transition",
                    !isPlanned && (modifiers.disabled || modifiers.outside ? "text-[#c8c3c9]" : "text-[#514956]"),
                    isInRequestRange && !isPlanned && !modifiers.outside && "font-bold text-[#3f3945]",
                    isPlanned && !modifiers.outside && "h-[26px] w-[26px] border-2 border-[var(--primary)] bg-white font-extrabold text-[var(--primary)]",
                    isPlanned && modifiers.outside && "h-[26px] w-[26px] border-2 border-[#d4c7dc] bg-[#faf8fb] font-extrabold text-[#b09bb9]"
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            },
          }}
          classNames={{
            root: "w-full overflow-hidden pb-0",
            months: "w-full",
            month: "w-full",
            month_grid: "w-full table-fixed",
            day: "h-8 p-0 text-center",
            day_button: "mx-auto",
            weekday: "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
            month_caption: "hidden",
          }}
        />
        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#817a85] px-2">
          <span className="h-3 w-3 rounded-full border-2 border-[var(--primary)] bg-white" />
          <span>{lang === "zh" ? "上门日期" : lang === "ja" ? "お世話日" : "Care dates"}</span>
        </div>
      </div>
    );
  }

  // 3. CUSTOM (自定义与灵活照护)
  const timePreferenceLabel =
    item.source === "V2" && item.schedule.custom?.timePreference
      ? customTimeLabel(
          item.schedule.custom.timePreference,
          item.schedule.custom.exactTime,
          t,
          needCopy,
        )
      : needCopy.needPublishing.timeOptions.flexible;

  return (
    <div className="w-full">
      {MonthNavHeader}
      <DayPicker
        key={`custom-${item.startsAt}:${item.endsAt}`}
        mode="range"
        month={calendarMonth}
        selected={startDate && endDate ? { from: startDate, to: endDate } : undefined}
        showOutsideDays
        fixedWeeks
        hideNavigation
        components={{
          DayButton: ({ day, modifiers, className, ...props }) => {
            const isStart = modifiers.range_start;
            const isEnd = modifiers.range_end;
            const isMiddle = modifiers.range_middle;
            const inRange = isStart || isMiddle || isEnd;
            return (
              <button
                {...props}
                tabIndex={-1}
                className={cn(
                  className,
                  "pointer-events-none relative mx-0 h-7 w-full rounded-none text-xs",
                  modifiers.outside ? "text-[#c8c3c9]" : "text-[#514956]"
                )}
              >
                {inRange && !(isStart && isEnd) ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-1",
                      modifiers.outside ? "bg-[#f3edf6]" : "bg-[#ede7f5]",
                      isStart && "left-1/2 right-0 rounded-l-full",
                      isMiddle && "left-0 right-0",
                      isEnd && "left-0 right-1/2 rounded-r-full"
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 mx-auto grid h-6.5 w-6.5 place-items-center rounded-full",
                    (isStart || isEnd) && !modifiers.outside && "bg-[var(--primary)] font-extrabold text-white shadow-sm",
                    (isStart || isEnd) && modifiers.outside && "bg-[#cbbbd4] font-extrabold text-white",
                    isMiddle && !modifiers.outside && "font-bold text-[#5d3a70]",
                    isMiddle && modifiers.outside && "font-bold text-[#b4a5bb]"
                  )}
                >
                  {day.date.getDate()}
                </span>
              </button>
            );
          },
        }}
        classNames={{
          root: "w-full overflow-hidden pb-0",
          months: "w-full",
          month: "w-full",
          month_grid: "w-full table-fixed",
          day: "h-8 p-0 text-center",
          day_button: "w-full",
          weekday: "w-7 pb-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
          month_caption: "hidden",
        }}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-[#817a85] px-2">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="h-3 w-3 rounded-full bg-[var(--primary)]" />
          <span>{lang === "zh" ? "服务窗口" : lang === "ja" ? "希望期間" : "Service window"}</span>
        </span>
        <span className="font-bold text-[#2B231D] flex items-center gap-1">
          <PiClock size={13} className="text-primary shrink-0" />
          <span>{timePreferenceLabel}</span>
        </span>
      </div>
    </div>
  );
}

export function PublicNeedDetail({
  publicId,
  initialLanguage,
}: {
  publicId: string;
  initialLanguage?: Lang;
}) {
  const decodedPublicId = decodeURIComponent(publicId);
  const lang = usePageLanguage(initialLanguage);
  const t = messages[lang];
  const needCopy = getNeedPublishingMessages(lang);
  const copy = t.core.marketplace;
  const prefix = initialLanguage ? `/${initialLanguage}` : "";
  const need = trpc.marketplaceNeed.get.useQuery({ publicId: decodedPublicId });

  const [expandedVisits, setExpandedVisits] = useState<Record<number, boolean>>({ 0: true });

  const toggleVisit = (idx: number) => {
    setExpandedVisits((prev) => {
      const isCurrentlyExpanded = prev[idx] ?? (idx === 0);
      return { ...prev, [idx]: !isCurrentlyExpanded };
    });
  };

  if (need.isLoading) {
    return <NeedDetailSkeleton />;
  }

  if (!need.data) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FAF8F5] px-4 text-center">
        <div className="rounded-3xl border border-[#EDE8E1] bg-white p-8 shadow-sm max-w-md w-full">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#2B231D]">{copy.needUnavailable}</h2>
          <p className="mt-2 text-sm text-[#706A60]">
            该照护需求可能已结束招募或已下架。
          </p>
          <Link
            href={`${prefix}/needs`}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#5d35be] transition"
          >
            <ArrowLeft size={16} />
            {copy.backNeeds}
          </Link>
        </div>
      </main>
    );
  }

  const item = need.data;
  const displayTitle = localizedNeedTitle(item, lang);
  const returnTo = `${prefix}/needs/${encodeURIComponent(publicId)}`;
  const daysTotal = inclusiveDayCount(item.startsAt, item.endsAt);
  const nightsTotal = calculateBoardingNights(item.startsAt, item.endsAt);
  const totalPets = item.pets.reduce((sum, pet) => sum + pet.quantity, 0);

  const modeLabel =
    item.mode === "HOME_VISIT"
      ? (lang === "zh" ? "上门照护" : lang === "ja" ? "訪問ケア" : "Home visits")
      : item.mode === "BOARDING"
      ? (lang === "zh" ? "家庭寄养" : lang === "ja" ? "ペットホテル" : "Pet boarding")
      : (lang === "zh" ? "定制需求" : lang === "ja" ? "カスタムケア" : "Custom care");

  const ModeIcon =
    item.mode === "HOME_VISIT"
      ? PiHouseLine
      : item.mode === "BOARDING"
      ? PiWarehouse
      : PiHandHeart;

  const dateRangeLabel = formatDateSpan(item.startsAt, item.endsAt, lang);

  const storyContent = buildNeedStoryText(item, lang, t);

  // Visit windows & frequency calculations
  const intervalDays = item.schedule?.homeVisit?.intervalDays || 1;
  const visitsPerDay = item.schedule?.homeVisit?.visitsPerServiceDay || 1;
  const visitWindows = item.schedule?.homeVisit?.visitWindows ?? [];

  // Centralized Domain Pricing Calculation
  const pricing = calculateNeedPricing(item);
  const totalVisitsCount = pricing.totalUnitsCount;
  const serviceDaysCount = pricing.serviceDaysCount;

  const homeVisitFrequencyLabel = formatHomeVisitFrequency(
    intervalDays,
    visitsPerDay,
    lang
  );

  const unitRateMinor = pricing.unitRateMinor;
  const careFeeSubtotalMinor = pricing.careFeeSubtotalMinor;
  const estimatedTotalMinor = pricing.estimatedTotalMinMinor;
  const fixedTravelPerVisitMinor = pricing.fixedTravelPerVisitMinor;
  const travelFeeSubtotalMinor = pricing.travelFeeSubtotalMinor;

  return (
    <main className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-[#FAF8F5] text-[#2B231D] lg:flex-row px-4 sm:px-6 lg:px-8 py-5 lg:py-6 gap-8 lg:gap-16 xl:gap-28 2xl:gap-36">
      {/* LEFT COLUMN: Fixed Header on top + Scrollable Body below */}
      <div className="flex flex-1 min-w-0 flex-col h-full overflow-hidden">
        {/* Fixed Top Header (Non-scrolling): Back link, Title, Status, Publisher Card, Meta Line */}
        <div className="shrink-0 px-0 pt-0 pb-3 space-y-3 bg-[#FAF8F5] border-b border-[#EDE8E1]/60">
          {/* 1. Breadcrumb navigation */}
          <div className="flex items-center text-xs text-slate-500">
            <nav aria-label={copy.breadcrumbLabel} className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`${prefix}/`}
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
            </nav>
          </div>

          {/* 2. Main Title with Mode Pill & Open for applications Pill */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#2B231D] sm:text-3xl leading-tight">
              {displayTitle}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-xs shrink-0",
                modeBadgeThemes[item.mode as keyof typeof modeBadgeThemes] ?? modeBadgeThemes.HOME_VISIT
              )}
            >
              <ModeIcon size={14} className="shrink-0 text-white" />
              <span>{modeLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3EC] border border-[#D5EADB] px-3 py-1 text-xs font-bold text-[#2D6A4F] shadow-2xs shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6A4F]" />
              <span>{lang === "zh" ? "招募中" : lang === "ja" ? "募集中" : "Open for applications"}</span>
            </span>
          </div>

          {/* 3. Meta line (Location, Date Range, Publish Date - Option 2: Magazine style) */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-sm">
            {/* 1. Location */}
            <p className="flex items-center gap-1.5 font-bold text-[#2B231D]">
              <MapPin size={15} className="text-[#8C7A68] shrink-0" />
              <span>{item.location.regionLabel || t.core.common.approximateArea}</span>
            </p>

            {/* Divider */}
            <span className="hidden sm:inline-block h-3.5 w-px bg-[#E0D8CD] shrink-0" />

            {/* 2. Date Range & Frequency */}
            <p className="flex items-center gap-1.5 font-bold text-[#2B231D]">
              <Calendar size={15} className="text-primary shrink-0" />
              <span>
                {dateRangeLabel}
                {item.mode === "HOME_VISIT" ? (
                  <span className="font-semibold text-[#5F5850]"> · {homeVisitFrequencyLabel}</span>
                ) : null}
              </span>
            </p>

            {/* Divider */}
            <span className="hidden sm:inline-block h-3.5 w-px bg-[#E0D8CD] shrink-0" />

            {/* 3. Publish Date (Secondary timestamp) */}
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#8C8479]">
              <PiClock size={14} className="text-[#A59D91] shrink-0" />
              <span>
                {lang === "zh"
                  ? `发布于 ${formatPublishedAt(item.createdAt, lang)}`
                  : lang === "ja"
                  ? `${formatPublishedAt(item.createdAt, lang)}に投稿`
                  : `Posted on ${formatPublishedAt(item.createdAt, lang)}`}
              </span>
            </p>
          </div>
        </div>

        {/* Scrollable Body Below Title & Publisher Card */}
        <div className="flex-1 overflow-y-auto px-0 py-4 space-y-6 pr-1.5 sm:pr-2">
          {/* 7. Section: 📖 About this request */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <PiBookOpen size={22} className="text-primary" />
              <h2 className="font-serif text-xl font-bold text-[#2B231D]">
                {lang === "zh" ? "需求概述" : lang === "ja" ? "ご依頼の概要" : "About this request"}
              </h2>
            </div>
            <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5 sm:p-6 shadow-2xs">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#4A423A]">
                {storyContent}
              </p>
            </div>
          </section>

          {/* 8. Section: 🐾 Pets to care for */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <PiPawPrint size={22} className="text-primary" />
              <h2 className="font-serif text-xl font-bold text-[#2B231D]">
                {lang === "zh" ? "需要照顾的宠物" : lang === "ja" ? "お世話するペット" : "Pets to care for"}
              </h2>
              <span className="rounded-full bg-[#FAF3EC] px-2.5 py-0.5 text-xs font-bold text-[#8A5D34]">
                {item.pets.length} {item.pets.length === 1 ? (lang === "zh" ? "只宠物" : lang === "ja" ? "匹" : "pet") : (lang === "zh" ? "只宠物" : lang === "ja" ? "匹" : "pets")}
              </span>
            </div>

            {/* Single unified card container with divider lines inside */}
            <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5 sm:p-6 shadow-2xs">
              <div className="divide-y divide-[#EDE8E1]">
                {chunkArray(item.pets, 2).map((pair, rowIdx, allRows) => (
                  <div
                    key={rowIdx}
                    className={cn(
                      "grid grid-cols-1 divide-y md:divide-y-0 divide-[#EDE8E1]",
                      item.pets.length > 1 && "md:grid-cols-2 md:divide-x",
                      rowIdx > 0 && "pt-5 sm:pt-6",
                      rowIdx < allRows.length - 1 && "pb-5 sm:pb-6"
                    )}
                  >
                    {pair.map((pet: any, pIdx: number) => {
                      const petLabel = t.core.pets[pet.petType as keyof typeof t.core.pets] ?? pet.petType;
                      const breedLabel = pet.breed ? localizePetBreed(pet.breed, lang, pet.petType) : null;
                      const ageText = formatPetAge(pet.birthDate, t);
                      const genderInfo = formatPetGenderAndNeuter(pet.sex, pet.neutered, lang, t);
                      const weightText = formatPetWeight(pet.weightGrams, lang);

                      return (
                        <div
                          key={`${pet.name || pet.petType}-${pIdx}`}
                          className={cn(
                            "flex flex-col justify-between space-y-3",
                            item.pets.length > 1 && (
                              pIdx === 0
                                ? "md:pr-6 pb-4 md:pb-0 first:pt-0"
                                : "pt-4 md:pt-0 md:pl-6"
                            )
                          )}
                        >
                          <div className="flex items-start gap-3.5 sm:gap-4">
                            {/* Pet Avatar with Hover Enlarged Preview */}
                            <div className="relative group shrink-0">
                              <div className="relative h-15 w-15 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border border-slate-100 bg-[#FFF8E8] shadow-2xs">
                                {pet.image ? (
                                  <AppImage
                                    src={pet.image}
                                    alt={pet.name || petLabel}
                                    width={72}
                                    height={72}
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

                              {/* Floating Hover Enlarged Preview */}
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
                            <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                              {/* Row 1: Pet Name, Type Badge & Quantity */}
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-extrabold text-[#2B231D] text-base sm:text-lg leading-tight">
                                  {pet.name || `${petLabel} #${rowIdx * 2 + pIdx + 1}`}
                                </h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                  <PiPawPrint className="h-3 w-3 text-primary shrink-0" />
                                  <span>{petLabel}</span>
                                </span>
                                {pet.quantity > 1 ? (
                                  <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-amber-800">
                                    {lang === "zh" ? `共 ${pet.quantity} 只` : lang === "ja" ? `${pet.quantity} 匹` : `${pet.quantity} pets`}
                                  </span>
                                ) : null}
                              </div>

                              {/* Row 2: Clean Inline Metadata with Colored Typography & Dot Separators */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed pt-0.5">
                                {/* Breed */}
                                {breedLabel ? (
                                  <span className="font-semibold text-[#2B231D]">
                                    {breedLabel}
                                  </span>
                                ) : null}

                                {/* Dot */}
                                {breedLabel && (ageText || weightText || genderInfo) ? (
                                  <span className="text-[#C4BCB1] select-none font-normal">·</span>
                                ) : null}

                                {/* Age */}
                                {ageText ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                                    <PiCalendarBlank className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <span>{ageText}</span>
                                  </span>
                                ) : null}

                                {/* Dot */}
                                {ageText && (weightText || genderInfo) ? (
                                  <span className="text-[#C4BCB1] select-none font-normal">·</span>
                                ) : null}

                                {/* Weight */}
                                {weightText ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                    <Scale className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span>{weightText}</span>
                                  </span>
                                ) : null}

                                {/* Dot */}
                                {weightText && genderInfo ? (
                                  <span className="text-[#C4BCB1] select-none font-normal">·</span>
                                ) : null}

                                {/* Gender / Neuter */}
                                {genderInfo ? (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 font-medium",
                                      genderInfo.genderKind === "MALE"
                                        ? "text-sky-700"
                                        : genderInfo.genderKind === "FEMALE"
                                        ? "text-rose-700"
                                        : "text-[#6B6359]"
                                    )}
                                  >
                                    {genderInfo.genderKind === "MALE" ? (
                                      <PiGenderMale className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                                    ) : genderInfo.genderKind === "FEMALE" ? (
                                      <PiGenderFemale className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                    ) : (
                                      <PiPawPrint className="h-3.5 w-3.5 text-[#8C8479] shrink-0" />
                                    )}
                                    <span>{genderInfo.label}</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Row 3: 备注 (Care Notes / Remarks) */}
                          {pet.careNotes ? (
                            <div className="flex items-start gap-2 rounded-xl bg-[#FAF6F0] border border-[#EFE7DC] px-3 py-2 text-xs text-[#514956]">
                              <PiChatCircleDots size={15} className="text-primary shrink-0 mt-0.5" />
                              <p className="leading-relaxed whitespace-pre-wrap break-words">
                                <span className="font-bold text-[#8A5D34]">{lang === "zh" ? "备注：" : lang === "ja" ? "備考：" : "Note: "}</span>
                                {pet.careNotes}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 9. Section: 📅 Care schedule & tasks */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              {item.mode === "BOARDING" ? (
                <PiListChecks size={22} className="text-primary" />
              ) : item.mode === "CUSTOM" ? (
                <PiFileText size={22} className="text-primary" />
              ) : (
                <PiClock size={22} className="text-primary" />
              )}
              <h2 className="font-serif text-xl font-bold text-[#2B231D]">
                {item.mode === "BOARDING"
                  ? (lang === "zh" ? "日常照护任务" : lang === "ja" ? "日常のお世話タスク" : "Daily care tasks")
                  : item.mode === "CUSTOM"
                  ? (lang === "zh" ? "照护需求与任务" : lang === "ja" ? "お世話内容とタスク" : "Care tasks & details")
                  : (lang === "zh" ? "照护计划与任务" : lang === "ja" ? "お世話計画とタスク" : "Care schedule & tasks")}
              </h2>
            </div>

            {item.source === "V2" && item.scheduleNotes ? (
              <div className="rounded-2xl border border-[#EDE8E1] bg-[#FAF6F0] p-4 text-sm text-[#514956] shadow-2xs">
                <p className="font-bold text-[#8A5D34]">
                  {lang === "zh" ? "时间备注" : lang === "ja" ? "時間に関するメモ" : "Schedule notes"}
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-6 break-words">
                  {item.scheduleNotes}
                </p>
              </div>
            ) : null}

            {item.mode === "HOME_VISIT" ? (
              <div className="space-y-3.5">
                {/* Top Macro Schedule Rhythm Bar */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 rounded-2xl bg-white border border-[#EDE8E1] p-3.5 sm:p-4 text-xs font-semibold text-[#514956] shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8C8479]">{lang === "zh" ? "频率:" : lang === "ja" ? "頻度:" : "Frequency:"}</span>
                    <span className="font-extrabold text-[#2B231D]">
                      {intervalDays === 1
                        ? (lang === "zh" ? "每天" : lang === "ja" ? "毎日" : "Daily")
                        : (lang === "zh" ? `每 ${intervalDays} 天` : lang === "ja" ? `${intervalDays}日ごと` : `Every ${intervalDays} days`)}
                    </span>
                  </div>
                  <span className="text-[#D8D0C5] hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8C8479]">
                      {lang === "zh" ? "服务日次数:" : lang === "ja" ? "訪問日あたり:" : "Visits / day:"}
                    </span>
                    <span className="font-extrabold text-[#2B231D]">
                      {lang === "zh"
                        ? `${visitsPerDay} 次/天`
                        : lang === "ja"
                        ? `${visitsPerDay}回/日`
                        : `${visitsPerDay} / day`}
                    </span>
                  </div>
                  <span className="text-[#D8D0C5] hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8C8479]">{lang === "zh" ? "总上门数:" : lang === "ja" ? "総訪問回数:" : "Total visits:"}</span>
                    <span className="font-extrabold text-[var(--primary)]">
                      {lang === "zh"
                        ? `共 ${totalVisitsCount} 次上门`
                        : lang === "ja"
                        ? `全${totalVisitsCount}回`
                        : `${totalVisitsCount} visits`}
                    </span>
                  </div>
                  <span className="text-[#D8D0C5] hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8C8479]">{lang === "zh" ? "总天数:" : lang === "ja" ? "総日数:" : "Total days:"}</span>
                    <span className="font-extrabold text-[#2B231D]">
                      {lang === "zh"
                        ? `共 ${serviceDaysCount} 天`
                        : lang === "ja"
                        ? `全${serviceDaysCount}日間`
                        : `${serviceDaysCount} care days`}
                    </span>
                  </div>
                </div>

                {/* Visit Windows & Tasks: each visit is an independent block, clickable to toggle */}
                <div className="space-y-3">
                  {Array.from({ length: visitsPerDay }).map((_, vIdx) => {
                    const window = visitWindows[vIdx];
                    const windowTimeLabel = formatVisitWindowTime(window, lang, t, needCopy);
                    const isExpanded = expandedVisits[vIdx] ?? (vIdx === 0);

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

                    return (
                      <div
                        key={vIdx}
                        className="rounded-2xl border border-[#EDE8E1] bg-white shadow-2xs overflow-hidden transition hover:border-primary/25"
                      >
                        {/* Visit Header (Clickable everywhere) */}
                        <div
                          onClick={() => toggleVisit(vIdx)}
                          className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none bg-white hover:bg-primary/[0.04] transition"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-extrabold text-[#2B231D]">
                            <span>
                              {lang === "zh" ? `第 ${vIdx + 1} 次上门` : `Visit ${vIdx + 1}`}
                            </span>
                            <span className="text-slate-300 font-normal">·</span>
                            <span className="text-xs sm:text-sm font-semibold text-[#8C8479] inline-flex items-center gap-1.5">
                              <PiClock className="h-3.5 w-3.5 text-primary shrink-0" />
                              {windowTimeLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span>
                              {isExpanded
                                ? (lang === "zh" ? "收起" : lang === "ja" ? "閉じる" : "Collapse")
                                : (lang === "zh" ? "展开任务" : lang === "ja" ? "展開" : "Expand")}
                            </span>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        {/* Task details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-[#EDE8E1]/70">
                            <div className="divide-y divide-[#EDE8E1]">
                              {visitGroups.map((group) => (
                                <div key={group.key} className="py-4 sm:py-4.5 first:pt-3.5 last:pb-1">
                                  <PetGroupTaskDirectLayout group={group} lang={lang} t={t} mode={item.mode} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : item.mode === "BOARDING" ? (
              <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                {/* Transport & Distance summary banner */}
                {item.schedule?.boarding?.transportMode || item.schedule?.boarding?.maxProviderDistanceMeters ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {item.schedule?.boarding?.transportMode ? (
                      <div className="rounded-xl bg-[#FAF6F0] p-3.5 border border-[#EFE7DC] flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white border border-[#EFE7DC] flex items-center justify-center text-primary shrink-0">
                          <Car size={18} />
                        </div>
                        <div>
                          <span className="text-[#8C8479] font-bold">
                            {lang === "zh" ? "接送方式" : lang === "ja" ? "送迎方法" : "Transport method"}
                          </span>
                          <p className="font-extrabold text-[#2B231D] text-sm mt-0.5">
                            {formatTransportModeLabel(item.schedule.boarding.transportMode, lang)}
                          </p>
                        </div>
                      </div>
                    ) : null}
                    {item.schedule?.boarding?.maxProviderDistanceMeters ? (
                      <div className="rounded-xl bg-[#FAF6F0] p-3.5 border border-[#EFE7DC] flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white border border-[#EFE7DC] flex items-center justify-center text-primary shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <span className="text-[#8C8479] font-bold">
                            {lang === "zh" ? "期望寄养距离" : lang === "ja" ? "希望距離" : "Max boarding distance"}
                          </span>
                          <p className="font-extrabold text-[#2B231D] text-sm mt-0.5">
                            {Math.round(item.schedule.boarding.maxProviderDistanceMeters / 1000)} km {lang === "zh" ? "以内" : lang === "ja" ? "以内" : "or less"}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Tasks by Pet Group */}
                <div className="divide-y divide-[#EDE8E1]">
                  {groupPetsAndTasks(item.pets, item.tasks, lang, t).map((group) => (
                    <div key={group.key} className="py-4 sm:py-4.5 first:pt-1 last:pb-1">
                      <PetGroupTaskDirectLayout group={group} lang={lang} t={t} mode={item.mode} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                {/* Custom Schedule Preference */}
                {customScheduleSummaryBadge(
                  item.startsAt,
                  item.endsAt,
                  item.source === "V2" ? item.schedule.custom?.timePreference : null,
                  item.source === "V2" ? item.schedule.custom?.exactTime : null,
                  lang,
                  t,
                  needCopy,
                ) ? (
                  <div className="rounded-xl bg-[#FAF6F0] p-3.5 border border-[#EFE7DC] text-xs font-bold text-[#8A5D34]">
                    {customScheduleSummaryBadge(
                      item.startsAt,
                      item.endsAt,
                      item.source === "V2" ? item.schedule.custom?.timePreference : null,
                      item.source === "V2" ? item.schedule.custom?.exactTime : null,
                      lang,
                      t,
                      needCopy,
                    )}
                  </div>
                ) : null}

                {/* Tasks by Pet Group */}
                <div className="divide-y divide-[#EDE8E1]">
                  {groupPetsAndTasks(item.pets, item.tasks, lang, t).map((group) => (
                    <div key={group.key} className="py-4 sm:py-4.5 first:pt-3.5 last:pb-1">
                      <PetGroupTaskDirectLayout group={group} lang={lang} t={t} mode={item.mode} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 10. Section: 🎒 Supplies (if any) */}
          {item.supplies && item.supplies.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Package size={22} className="text-primary" />
                <h2 className="font-serif text-xl font-bold text-[#2B231D]">
                  {lang === "zh" ? "物品准备" : lang === "ja" ? "持ち物・準備品" : "Supplies & equipment"}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.supplies.map((supply, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-2xl border border-[#EDE8E1] bg-white px-4 py-3 text-xs font-bold text-[#4A423A] shadow-2xs"
                  >
                    <span>{supply.label}</span>
                    <span className="rounded-full bg-[#FAF3EC] px-2.5 py-0.5 text-[11px] text-[#8A5D34]">
                      {supply.providedBy === "OWNER" ? (lang === "zh" ? "饲主自带" : "Owner provides") : (lang === "zh" ? "寄养方提供" : "Sitter provides")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

{/* 11. Section: ⚠️ Requirements (if any) */}
          {item.requirements && item.requirements.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <PiShieldCheck size={22} className="text-primary" />
                <h2 className="font-serif text-xl font-bold text-[#2B231D]">
                  {lang === "zh" ? "特殊要求与注意事项" : lang === "ja" ? "注意事項・条件" : "Requirements"}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-2xl border border-[#EDE8E1] bg-white p-3.5 text-xs font-semibold text-[#4A423A] shadow-2xs"
                  >
                    <CheckCircle2 size={16} className="text-[#2D6A4F] shrink-0" />
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 12. Section: 📍 Service location Map */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin size={22} className="text-primary" />
              <h2 className="font-serif text-xl font-bold text-[#2B231D]">
                {lang === "zh" ? "服务地点" : lang === "ja" ? "お世話場所" : "Service location"}
              </h2>
            </div>
            <div className="rounded-2xl border border-[#EDE8E1] bg-white p-4 shadow-2xs">
              <div className="h-60 w-full overflow-hidden rounded-xl border border-[#EDE8E1]">
                <MapLibreMap
                  lat={item.location.mapPoint.lat}
                  lon={item.location.mapPoint.lon}
                  zoom={13}
                  editable={false}
                  showPrimaryMarker={true}
                  showPrivacyRadius={false}
                  scrollZoom={false}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* RIGHT COLUMN: Single Unified Fixed Card */}
      <aside className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[350px] lg:shrink-0 px-0 py-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
        <div className="rounded-3xl border border-[#EDE8E1] bg-white p-4 sm:p-5 shadow-sm space-y-4">
          {/* 1. Month Calendar Section */}
          <div>
            <NeedCalendarView
              item={item}
              lang={lang}
            />
          </div>

          {/* 2. Amount & Breakdown Section */}
          {(() => {
            // Home Visit specialized calculations
            const isCareOpen = pricing.budgetKind === "OPEN";
            const isCareRange = pricing.budgetKind === "RANGE";
            const isCareExact = pricing.budgetKind === "EXACT";

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
              const visitTimesStr =
                lang === "zh"
                  ? `${totalVisitsCount} 次`
                  : lang === "ja"
                  ? `${totalVisitsCount} 回`
                  : `${totalVisitsCount} ${totalVisitsCount === 1 ? "visit" : "visits"}`;

              // 1. Big Price & Sublabel
              if (isCareOpen) {
                if (isTravelFixed && travelUnit > 0) {
                  const travelTotal = travelUnit * totalVisitsCount;
                  bigPriceText = formatMoney(travelTotal, pricing.currency);
                  bigPriceSubLabel = lang === "zh" ? "预估总额" : lang === "ja" ? "見積合計" : "estimated total";
                } else {
                  bigPriceText =
                    lang === "zh"
                      ? "待协商"
                      : lang === "ja"
                      ? "相談して決定"
                      : "To be discussed";
                  bigPriceSubLabel = null;
                }
              } else if (isCareRange && careUnitRateMax) {
                const minTotal =
                  pricing.estimatedTotalMinMinor ??
                  ((careUnitRateMin ?? 0) + (isTravelFixed ? travelUnit : 0)) * totalVisitsCount;
                const maxTotal =
                  pricing.estimatedTotalMaxMinor ??
                  ((careUnitRateMax ?? 0) + (isTravelFixed ? travelUnit : 0)) * totalVisitsCount;
                bigPriceText = `${formatMoney(minTotal, pricing.currency)} – ${formatMoney(maxTotal, pricing.currency)}`;
                bigPriceSubLabel = lang === "zh" ? "预估总额" : lang === "ja" ? "見積合計" : "estimated total";
              } else {
                const exactTotal =
                  pricing.estimatedTotalMinMinor ??
                  ((careUnitRateMin ?? 0) + (isTravelFixed ? travelUnit : 0)) * totalVisitsCount;
                bigPriceText = formatMoney(exactTotal, pricing.currency);
                bigPriceSubLabel = lang === "zh" ? "预估总额" : lang === "ja" ? "見積合計" : "estimated total";
              }

              // 2. Formula & Note Logic
              // Case 1: 交通费不是实报实销（即固定费或0），照顾单价不是稍后讨论（即固定值或范围值）
              // 公式: (照顾单价 + 交通费用) * 总访问次数 (文字公式)
              if (!isTravelActual && !isCareOpen) {
                if (isTravelFixed) {
                  formulaText =
                    lang === "zh"
                      ? "(照顾单价 + 交通费用) × 总访问次数"
                      : lang === "ja"
                      ? "(お世話単価 + 交通費) × 総訪問回数"
                      : "(Care fee + Travel fee) × Total visits";
                } else {
                  formulaText =
                    lang === "zh"
                      ? "照顾单价 × 总访问次数"
                      : lang === "ja"
                      ? "お世話単価 × 総訪問回数"
                      : "Care fee × Total visits";
                }
                statusNoteText = null;
              }
              // Case 2: 如果交通费是实报实销，固定单价不是稍后讨论，公式就是照顾单价*总访问次数，换一行表示不包含交通费。
              else if (isTravelActual && !isCareOpen) {
                formulaText =
                  lang === "zh"
                    ? "照顾单价 × 总访问次数"
                    : lang === "ja"
                    ? "お世話単価 × 総訪問回数"
                    : "Care fee × Total visits";
                statusNoteText =
                  lang === "zh"
                    ? "不包含交通费"
                    : lang === "ja"
                    ? "交通費を含まない"
                    : "Excluding travel costs";
              }
              // Case 3: 如果交通费不是实报实销，照顾单价是稍后讨论，公式就是交通费用*总访问次数，换一行表示不包含照顾费。
              else if (!isTravelActual && isCareOpen) {
                if (isTravelFixed) {
                  formulaText =
                    lang === "zh"
                      ? "交通费用 × 总访问次数"
                      : lang === "ja"
                      ? "交通費 × 総訪問回数"
                      : "Travel fee × Total visits";
                  statusNoteText =
                    lang === "zh"
                      ? "不包含照顾费"
                      : lang === "ja"
                      ? "お世話料金を含まない"
                      : "Excluding care fee";
                } else {
                  formulaText = null;
                  statusNoteText = null;
                }
              }
              // Case 4: 如果交通费是实报实销，照顾单价是稍后讨论，就没有公式上面金额部分显示To be discussed，下面显示不包含交通费。
              else if (isTravelActual && isCareOpen) {
                formulaText = null;
                statusNoteText =
                  lang === "zh"
                    ? "不包含交通费"
                    : lang === "ja"
                    ? "交通費を含まない"
                    : "Excluding travel costs";
              }
            } else if (item.mode === "BOARDING") {
              if (isCareOpen) {
                bigPriceText = lang === "zh" ? "待协商" : lang === "ja" ? "相談して決定" : "To be discussed";
                bigPriceSubLabel = null;
              } else if (isCareRange && careUnitRateMax) {
                bigPriceText = `${formatMoney(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoney(pricing.estimatedTotalMaxMinor ?? 0, pricing.currency)}`;
                bigPriceSubLabel = lang === "zh" ? "预估总额" : lang === "ja" ? "見積合計" : "estimated total";
                formulaText =
                  lang === "zh"
                    ? "每晚寄养单价 × 寄养总晚数"
                    : lang === "ja"
                    ? "1泊あたり料金 × 宿泊数"
                    : "Nightly rate × Total nights";
              } else {
                bigPriceText = formatMoney(pricing.estimatedTotalMinMinor ?? 0, pricing.currency);
                bigPriceSubLabel = lang === "zh" ? "预估总额" : lang === "ja" ? "見積合計" : "estimated total";
                formulaText =
                  lang === "zh"
                    ? "每晚寄养单价 × 寄养总晚数"
                    : lang === "ja"
                    ? "1泊あたり料金 × 宿泊数"
                    : "Nightly rate × Total nights";
              }
            } else {
              // CUSTOM
              bigPriceText =
                pricing.budgetKind === "OPEN"
                  ? (lang === "zh" ? "待协商" : "To be discussed")
                  : pricing.budgetKind === "RANGE" && pricing.estimatedTotalMaxMinor
                  ? `${formatMoney(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoney(pricing.estimatedTotalMaxMinor, pricing.currency)}`
                  : formatMoney(pricing.estimatedTotalMinMinor ?? 0, pricing.currency);
              bigPriceSubLabel = pricing.budgetKind === "OPEN" ? null : lang === "zh" ? "预估总额" : "estimated total";
            }

            const careUnitPriceDisplay =
              pricing.budgetKind === "OPEN"
                ? (lang === "zh" ? "待协商" : lang === "ja" ? "相談" : "To be discussed")
                : pricing.budgetKind === "RANGE" && pricing.unitMaxRateMinor
                ? `${formatMoney(pricing.unitRateMinor ?? 0, pricing.currency)} – ${formatMoney(pricing.unitMaxRateMinor, pricing.currency)}`
                : `${formatMoney(pricing.unitRateMinor ?? 0, pricing.currency)}`;

            const travelFeeDisplay =
              travelMode === "FIXED" && travelUnit > 0
                ? `${formatMoney(travelUnit, pricing.currency)}`
                : travelMode === "ACTUAL"
                ? (lang === "zh" ? "实报实销" : lang === "ja" ? "実費精算" : "Reimbursed")
                : (lang === "zh" ? "无" : lang === "ja" ? "なし" : "None");

            return (
              <div className="space-y-3 pt-3 border-t border-[#F2EFE9]">
                {/* Big Price Display & Formula */}
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-sans text-2xl sm:text-3xl font-black text-primary tracking-tight">
                      {bigPriceText}
                    </span>
                    {bigPriceSubLabel ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {bigPriceSubLabel}
                      </span>
                    ) : null}
                    {pricing.isNegotiable && !isCareOpen && !isCareRange ? (
                      <span className="rounded-full bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {lang === "zh" ? "可议价" : lang === "ja" ? "相談可" : "Negotiable"}
                      </span>
                    ) : null}
                  </div>

                  {/* Formula & Note subline (放在同一行) */}
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

                {/* Rate Breakdown Items (分别列出总visit数、每次visit照顾单价、每次visit交通费) */}
                {item.mode === "HOME_VISIT" ? (
                  <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
                    {/* 1. 总 visit 数 */}
                    <div className="flex justify-between">
                      <span>{lang === "zh" ? "总上门数" : lang === "ja" ? "総訪問回数" : "Total visits"}</span>
                      <span className="font-extrabold text-[#2B231D]">
                        {lang === "zh"
                          ? `${totalVisitsCount} 次`
                          : lang === "ja"
                          ? `${totalVisitsCount} 回`
                          : `${totalVisitsCount}`}
                      </span>
                    </div>

                    {/* 2. 每次 visit 的照顾单价 */}
                    <div className="flex justify-between">
                      <span>{lang === "zh" ? "每次照顾单价" : lang === "ja" ? "1回あたりのお世話料金" : "Care price / visit"}</span>
                      <span className="font-extrabold text-[#2B231D]">
                        {careUnitPriceDisplay}
                      </span>
                    </div>

                    {/* 3. 每次 visit 的交通费 */}
                    <div className="flex justify-between">
                      <span>{lang === "zh" ? "每次交通费" : lang === "ja" ? "1回あたりの交通費" : "Travel fee / visit"}</span>
                      <span className="font-extrabold text-[#2D6A4F]">
                        {travelFeeDisplay}
                      </span>
                    </div>
                  </div>
                ) : item.mode === "BOARDING" ? (
                  <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
                    <div className="flex justify-between">
                      <span>{lang === "zh" ? "寄养总晚数" : lang === "ja" ? "宿泊数" : "Total nights"}</span>
                      <span className="font-extrabold text-[#2B231D]">
                        {lang === "zh" ? `${nightsTotal} 晚` : lang === "ja" ? `${nightsTotal} 泊` : `${nightsTotal} ${nightsTotal === 1 ? "night" : "nights"}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === "zh" ? "每晚寄养单价" : lang === "ja" ? "1泊あたりの料金" : "Nightly rate"}</span>
                      <span className="font-extrabold text-[#2B231D]">
                        {pricing.budgetKind === "OPEN"
                          ? (lang === "zh" ? "待协商" : lang === "ja" ? "相談の上決定" : "To be discussed")
                          : pricing.budgetKind === "RANGE" && pricing.unitMaxRateMinor
                          ? `${formatMoney(pricing.unitRateMinor ?? 0, pricing.currency)} – ${formatMoney(pricing.unitMaxRateMinor, pricing.currency)}`
                          : `${formatMoney(pricing.unitRateMinor ?? 0, pricing.currency)}`}
                      </span>
                    </div>
                    {/* Separate each additional cost (Travel, Supply) into individual dedicated lines */}
                    {item.source === "V2" && item.additionalCosts.length > 0
                      ? item.additionalCosts
                          .filter((c) => c.mode !== "NONE")
                          .map((c, idx) => {
                            const isTravel = c.kind === "TRAVEL";
                            const label = isTravel
                              ? (lang === "zh" ? "交通补贴" : lang === "ja" ? "交通費" : "Travel fee")
                              : (lang === "zh" ? "物资补贴" : lang === "ja" ? "用品費" : "Supply fee");

                            const valueText =
                              c.mode === "FIXED" && c.amountMinor != null
                                ? `+${formatMoney(c.amountMinor, item.budget.currency)}`
                                : c.mode === "ACTUAL"
                                ? (lang === "zh" ? "实报实销" : lang === "ja" ? "実費精算" : "Reimbursed")
                                : (lang === "zh" ? "沟通协商" : lang === "ja" ? "相談可" : "To be discussed");

                            return (
                              <div key={idx} className="flex justify-between">
                                <span>{label}</span>
                                <span className="font-extrabold text-[#2D6A4F]">{valueText}</span>
                              </div>
                            );
                          })
                      : null}
                  </div>
                ) : (
                  <div className="space-y-2 text-xs font-semibold text-[#706A60] pt-1">
                    <div className="flex justify-between">
                      <span>{lang === "zh" ? "照护服务费" : lang === "ja" ? "お世話料金" : "Care fee"}</span>
                      <span className="font-extrabold text-[#2B231D]">
                        {pricing.budgetKind === "OPEN"
                          ? (lang === "zh" ? "待协商" : lang === "ja" ? "相談の上決定" : "To be discussed")
                          : pricing.budgetKind === "RANGE" && pricing.estimatedTotalMaxMinor
                          ? `${formatMoney(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)} – ${formatMoney(pricing.estimatedTotalMaxMinor, pricing.currency)}`
                          : formatMoney(pricing.estimatedTotalMinMinor ?? 0, pricing.currency)}
                      </span>
                    </div>
                    {item.source === "V2" && item.additionalCosts.length > 0
                      ? item.additionalCosts
                          .filter((c) => c.mode !== "NONE")
                          .map((c, idx) => {
                            const isTravel = c.kind === "TRAVEL";
                            const label = isTravel
                              ? (lang === "zh" ? "交通补贴" : lang === "ja" ? "交通費" : "Travel fee")
                              : (lang === "zh" ? "物资补贴" : lang === "ja" ? "用品費" : "Supply fee");

                            const valueText =
                              c.mode === "FIXED" && c.amountMinor != null
                                ? `+${formatMoney(c.amountMinor, item.budget.currency)}`
                                : c.mode === "ACTUAL"
                                ? (lang === "zh" ? "实报实销" : lang === "ja" ? "実費精算" : "Reimbursed")
                                : (lang === "zh" ? "沟通协商" : lang === "ja" ? "相談可" : "To be discussed");

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
            );
          })()}

          {/* 3. Action Buttons Section */}
          <div className="space-y-2.5 pt-2 border-t border-[#F2EFE9]">
            <PendingActionLink
              action="APPLY_NEED"
              targetId={publicId}
              returnTo={returnTo}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#5d35be] active:scale-[0.99] transition text-center"
            >
              {lang === "zh" ? "申请照顾" : lang === "ja" ? "お世話に応募する" : "Apply to help"}
            </PendingActionLink>

            <div className="w-full">
              <FavoriteButton kind="NEED" publicId={publicId} returnTo={returnTo} />
            </div>
          </div>

          {/* 4. Owner Info Section (Clickable to user profile / 个人中心) */}
          <Link
            href={`${prefix}/providers/${encodeURIComponent(item.owner.id)}`}
            className="pt-3.5 border-t border-[#F2EFE9] flex items-center justify-between gap-3 group transition rounded-2xl hover:bg-[#FAF8F5] -mx-2 px-2 py-1.5 cursor-pointer"
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
                  {lang === "zh" ? "需求发布者" : lang === "ja" ? "依頼主" : "Request owner"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5F5850] shrink-0 bg-[#FAF8F5] group-hover:bg-white px-2.5 py-1 rounded-xl border border-[#EDE8E1] transition-colors">
              <PiFileText size={14} className="text-[#8C8479]" />
              <span>
                {lang === "zh"
                  ? `已发 ${item.owner.requestsCount ?? 1} 篇`
                  : lang === "ja"
                  ? `${item.owner.requestsCount ?? 1}件投稿`
                  : `${item.owner.requestsCount ?? 1} posted`}
              </span>
            </div>
          </Link>
        </div>
      </aside>

    </main>
  );
}
