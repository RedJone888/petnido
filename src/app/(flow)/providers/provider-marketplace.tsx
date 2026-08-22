"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { trpc } from "@/utils/trpc";
import { AppImage } from "@/components/ui/app-image";
import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";

export function ProviderMarketplace({ initialLanguage }: { initialLanguage?: Lang } = {}) {
  const lang = usePageLanguage(initialLanguage);
  const t = messages[lang];
  const copy = t.core.marketplace;
  const prefix = initialLanguage ? `/${initialLanguage}` : "";
  const [cursor, setCursor] = useState<string | undefined>();
  const providers = trpc.marketplaceService.listProviders.useQuery({ limit: 20, cursor });
  return <main className="min-h-screen bg-[#f8f6f9] px-4 py-10"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-primary">{copy.providerEyebrow}</p><h1 className="mt-2 text-3xl font-black">{copy.providerTitle}</h1><p className="mt-3 text-sm text-slate-600">{copy.providerIntro}</p></div><Link href={`${prefix}/services`} className="rounded-xl border border-primary px-5 py-3 text-sm font-black text-primary">{copy.browseServices}</Link></div>{providers.isLoading ? <p className="py-16 text-center text-sm text-slate-500">{copy.loadingProviders}</p> : null}{!providers.isLoading && providers.data?.items.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">{copy.noProviders}</p> : null}<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{providers.data?.items.map((provider) => <article key={provider.publicId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-purple-50">{provider.image ? <AppImage src={provider.image} alt="" width={56} height={56} className="h-full w-full object-cover" /> : "🐾"}</div><div><h2 className="font-black">{provider.nickname || t.core.common.providerFallback}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Star size={12} />{provider.rating.toFixed(1)} · {provider.reviewCount} {t.core.common.reviewCount}</p></div></div>{provider.introduction ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{provider.introduction}</p> : null}<p className="mt-4 text-xs font-bold text-slate-600">{provider.serviceCount} {copy.activeServices} · {provider.petTypes.map((pet) => t.core.pets[pet as keyof typeof t.core.pets]).join(", ") || copy.petPolicyInService}</p><Link href={`${prefix}/providers/${encodeURIComponent(provider.publicId)}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-white">{copy.viewProfile}</Link></article>)}</section>{providers.data?.nextCursor ? <div className="mt-8 text-center"><button type="button" onClick={() => setCursor(providers.data?.nextCursor ?? undefined)} className="min-h-11 rounded-xl border border-primary bg-white px-6 text-sm font-black text-primary">{copy.nextProviders}</button></div> : null}</div></main>;
}
