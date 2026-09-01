"use client";

import { BookmarkX, CalendarDays, Heart, HeartOff, LoaderCircle, MapPin, PawPrint } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PiHandHeart, PiHouseLine, PiWarehouse } from "react-icons/pi";

import { PendingActionLink } from "@/components/marketplace/pending-action-link";
import { useLanguage } from "@/components/providers/language-provider";
import { NeedLocationLabel } from "@/app/(flow)/needs/_components/need-card";
import { calculateNeedPricing, formatNeedEstimatedBadge, type NeedPricingInput } from "@/domain/marketplace/need-pricing";
import { trpc } from "@/utils/trpc";
import { DevelopmentBadge } from "../_components/development-badge";
import { DashboardNeedCard } from "../needs/_components/dashboard-need-card";

import {
  modeBadgeThemes as modeThemes,
  requestModeIcons as modeIcons,
} from "@/domain/care/care-themes";
import {
  needStatusThemes as statusThemes,
} from "@/domain/marketplace/need-status-theme";
import { needDisplayDateRange } from "@/domain/marketplace/need-date-range";
import { formatDateSpan } from "@/domain/date/presentation";

type FavoriteNeedItem = {
  publicId: string; source: "V2"; mode: string; title: string; startsAt: Date | string; endsAt: Date | string; timeZone?: string | null; createdAt: Date | string;
  location: { regionLabel: string | null; mapPoint: { lat: number | string; lon: number | string } };
  budget: { kind: string; minAmountMinor: number | null; maxAmountMinor: number | null; currency: string; negotiable: boolean };
  pets: Array<{ name?: string | null; petType: string; quantity: number; image?: string | null }>;
  attachments: Array<{ url: string }>;
  owner: { id: string; nickname: string | null; image: string | null };
  schedule: NeedPricingInput["schedule"];
  additionalCosts: NeedPricingInput["additionalCosts"];
};

function petSummary(item: FavoriteNeedItem, labels: Record<string, string>) {
  const counts = new Map<string, number>();
  item.pets.forEach((pet) => counts.set(pet.petType || "OTHER", (counts.get(pet.petType || "OTHER") ?? 0) + (pet.quantity || 1)));
  return Array.from(counts, ([type, count]) => `${labels[type] ?? type} ×${count}`).join(", ");
}

export default function FavoritesPage() {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();
  const copy = t.core.favorites;
  const selectedType = searchParams.get("type") === "services" ? "services" : "needs";
  const favorites = trpc.favorite.listMine.useQuery();
  const utils = trpc.useContext();
  const remove = trpc.favorite.set.useMutation({ onSuccess: () => utils.favorite.listMine.invalidate() });
  const visibleFavorites = favorites.data?.filter((favorite) => selectedType === "needs" ? favorite.kind === "NEED" : favorite.kind === "SERVICE");
  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  const localCopy = {
    apply: lang === "zh" ? "应聘" : lang === "ja" ? "応募する" : "Apply",
    published: lang === "zh" ? "发布于" : lang === "ja" ? "公開日" : "Published",
    unavailable: lang === "zh" ? "当前不可应聘" : lang === "ja" ? "現在応募できません" : "Applications unavailable",
    emptyNeedTitle: lang === "zh" ? "还没有收藏的需求" : lang === "ja" ? "お気に入りの依頼はまだありません" : "No favorite requests yet",
    emptyNeedDetail: lang === "zh" ? "收藏你感兴趣、之后可能想应聘的照护需求，它们会显示在这里。" : lang === "ja" ? "気になるケア依頼を保存すると、ここからいつでも確認できます。" : "Save care requests you may want to apply for and find them here later.",
    emptyNeedAction: lang === "zh" ? "浏览照护需求" : lang === "ja" ? "ケア依頼を見る" : "Browse care requests",
    emptyServiceTitle: lang === "zh" ? "还没有收藏的服务" : lang === "ja" ? "お気に入りのサービスはまだありません" : "No favorite services yet",
    emptyServiceDetail: lang === "zh" ? "收藏你感兴趣、之后可能想预约的照护服务，它们会显示在这里。" : lang === "ja" ? "気になるケアサービスを保存すると、ここからいつでも確認できます。" : "Save care services you may want to book and find them here later.",
    emptyServiceAction: lang === "zh" ? "浏览照护服务" : lang === "ja" ? "ケアサービスを見る" : "Browse care services",
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <header className="h-auto shrink-0 space-y-3 border-b border-slate-200/70 px-2 pt-3 md:flex md:h-[var(--dashboard-title-height)] md:flex-col md:justify-between md:pt-3">
        <h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">{copy.title}</h1>
        <nav aria-label={copy.title} className="flex w-full gap-2">
          <Link href="/dashboard/favorites?type=needs" aria-current={selectedType === "needs" ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-t-xl border-b-2 px-4 text-sm font-bold ${selectedType === "needs" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Heart className="h-4 w-4" />{copy.need}</Link>
          <Link href="/dashboard/favorites?type=services" aria-current={selectedType === "services" ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-t-xl border-b-2 px-4 text-sm font-bold ${selectedType === "services" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"}`}><PawPrint className="h-4 w-4" />{copy.service}</Link>
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8 pr-1 pt-4">
        {selectedType === "services" ? <DevelopmentBadge /> : null}
        {favorites.isLoading ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white p-10 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />{copy.loading}</div>
        ) : favorites.error ? (
          <div className="mt-4 rounded-2xl border border-danger-border bg-danger-bg p-5 text-sm text-danger-text" role="alert">{copy.error}</div>
        ) : !visibleFavorites?.length ? (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookmarkX className="mx-auto text-slate-300" size={34} /><h2 className="mt-4 font-bold text-slate-800">{selectedType === "needs" ? localCopy.emptyNeedTitle : localCopy.emptyServiceTitle}</h2><p className="mt-2 text-sm text-slate-500">{selectedType === "needs" ? localCopy.emptyNeedDetail : localCopy.emptyServiceDetail}</p>
            <Link href={selectedType === "needs" ? "/needs" : "/services"} className="mt-6 inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">{selectedType === "needs" ? localCopy.emptyNeedAction : localCopy.emptyServiceAction}</Link>
          </div>
        ) : selectedType === "needs" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleFavorites.map((favorite) => {
              if (favorite.kind !== "NEED") return null;
              if (!favorite.item) {
                return (
                  <article key={favorite.favoriteId} className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                    <BookmarkX size={28} className="text-slate-300" />
                    <h2 className="mt-3 text-sm font-bold text-slate-700">{copy.unavailableItem}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{copy.deletedDetail}</p>
                    <button type="button" disabled={remove.isLoading} onClick={() => remove.mutate({ target: { kind: "NEED", publicId: favorite.targetPublicId }, favorite: false })} className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-purple-200 px-3 py-2 text-xs font-bold text-primary hover:bg-purple-50 disabled:opacity-50"><HeartOff size={14} />{copy.remove}</button>
                  </article>
                );
              }
              const item = favorite.item as FavoriteNeedItem;
              const ModeIcon = modeIcons[item.mode as keyof typeof modeIcons] ?? PiHandHeart;
              const coverImage = item.pets.find((pet) => pet.image)?.image ?? null;
              const available = favorite.availability === "AVAILABLE";
              const displayStatus = favorite.displayStatus;
              const detailsHref = `/needs/${encodeURIComponent(favorite.targetPublicId)}`;
              const ownerName = item.owner.nickname || (lang === "zh" ? "PetNido 用户" : lang === "ja" ? "PetNidoユーザー" : "PetNido user");
              const pricing = calculateNeedPricing({ mode: item.mode as NeedPricingInput["mode"], startsAt: item.startsAt, endsAt: item.endsAt, schedule: item.schedule, budget: item.budget as NeedPricingInput["budget"], additionalCosts: item.additionalCosts });
              const totalPrice = formatNeedEstimatedBadge(pricing, t.core.common.openToOffers);
              const displayDates = needDisplayDateRange(item);
              return (
                <DashboardNeedCard key={favorite.favoriteId} href={detailsHref} coverImage={coverImage} fallbackPetType={item.pets[0]?.petType || "OTHER"} fallbackPetLabel={item.pets[0]?.name || item.title} modeIcon={ModeIcon} modeLabel={t.core.modes[item.mode as keyof typeof t.core.modes] ?? item.mode} modeTheme={modeThemes[item.mode as keyof typeof modeThemes] ?? modeThemes.CUSTOM} statusLabel={t.core.states[displayStatus as keyof typeof t.core.states] ?? displayStatus} statusTheme={statusThemes[displayStatus] ?? { container: "border-slate-300 bg-white/95 text-slate-600", dot: "bg-slate-400" }} title={item.title} budgetLabel={totalPrice} openBudget={item.budget.kind === "OPEN" || item.budget.minAmountMinor === null} owner={{ name: ownerName, image: item.owner.image }} publishedLabel={`${localCopy.published} `} publishedAt={item.createdAt} locale={locale} location={<p className="flex min-w-0 items-center gap-1.5"><MapPin size={13} className="shrink-0 text-slate-400" /><span className="truncate"><NeedLocationLabel regionLabel={item.location.regionLabel} mapPoint={{ lat: Number(item.location.mapPoint.lat), lon: Number(item.location.mapPoint.lon) }} distanceMeters={null} lang={lang} fallback={copy.approximateLocation} /></span></p>} schedule={<p className="flex min-w-0 items-center gap-1.5"><CalendarDays size={13} className="shrink-0 text-slate-400" /><span className="truncate">{formatDateSpan(displayDates.startDate, displayDates.endDate, lang)}</span></p>} pets={item.pets.length ? <p className="flex min-w-0 items-center gap-1.5"><PawPrint size={13} className="shrink-0 text-slate-400" /><span className="truncate">{petSummary(item, t.core.pets as Record<string, string>)}</span></p> : null} footer={<div className="flex items-center gap-2">{!favorite.isOwner && available ? <PendingActionLink action="APPLY_NEED" targetId={favorite.targetPublicId} returnTo="/dashboard/favorites?type=needs" className="flex min-h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90">{localCopy.apply}</PendingActionLink> : <button type="button" disabled title={favorite.isOwner ? undefined : localCopy.unavailable} className="flex min-h-9 flex-1 cursor-not-allowed items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-400">{localCopy.apply}</button>}<button type="button" aria-label={copy.remove} title={copy.remove} disabled={remove.isLoading} onClick={() => remove.mutate({ target: { kind: "NEED", publicId: favorite.targetPublicId }, favorite: false })} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-purple-200 px-3 py-2 text-xs font-bold text-primary transition hover:bg-purple-50 disabled:opacity-50"><HeartOff size={14} />{copy.remove}</button></div>} />
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {visibleFavorites.map((favorite) => {
              const item = favorite.item; const isAvailable = favorite.availability === "AVAILABLE"; const href = `/services/${encodeURIComponent(favorite.targetPublicId)}`;
              return <article key={favorite.favoriteId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-full bg-purple-50 px-2.5 py-1 text-primary">{copy.service}</span><span className={isAvailable ? "text-emerald-700" : "text-slate-500"}>{copy.availability[favorite.availability]}</span></div><h2 className="mt-3 truncate text-lg font-bold text-slate-900">{item?.title || copy.unavailableItem}</h2>{item ? <p className="mt-2 text-sm text-slate-500">{t.core.modes[item.mode as keyof typeof t.core.modes] ?? item.mode} · {item.location.regionLabel || copy.approximateLocation}</p> : <p className="mt-2 text-sm text-slate-500">{copy.deletedDetail}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{isAvailable ? <Link href={href} className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">{copy.viewDetails}</Link> : null}<button type="button" disabled={remove.isLoading} onClick={() => remove.mutate({ target: { kind: "SERVICE", publicId: favorite.targetPublicId }, favorite: false })} className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-50">{copy.remove}</button></div></div></article>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
