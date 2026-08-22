"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import { trpc } from "@/utils/trpc";
import { AppImage } from "@/components/ui/app-image";
import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";

export function ProviderDetail({ providerId, initialLanguage }: { providerId: string; initialLanguage?: Lang }) {
  const lang = usePageLanguage(initialLanguage);
  const t = messages[lang];
  const copy = t.core.marketplace;
  const prefix = initialLanguage ? `/${initialLanguage}` : "";
  const result = trpc.marketplaceService.getProvider.useQuery({ providerId });
  if (result.isLoading) return <main className="min-h-screen p-10 text-center text-sm text-slate-500">{copy.loadingProvider}</main>;
  if (!result.data) return <main className="min-h-screen p-10 text-center text-sm text-danger-text">{copy.providerUnavailable}</main>;
  const { provider, services } = result.data;
  return (
    <main className="min-h-screen bg-[#f8f6f9] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href={`${prefix}/providers`} className="text-sm font-black text-primary underline">
          {copy.backProviders}
        </Link>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-purple-50 text-3xl">
              {provider.image ? (
                <AppImage src={provider.image} alt="" width={96} height={96} className="h-full w-full object-cover" />
              ) : (
                "🐾"
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black">{provider.nickname || t.core.common.providerFallback}</h1>
              <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                <Star size={15} />
                {provider.rating.toFixed(1)} · {provider.reviewCount} {t.core.common.reviewCount}
                {provider.monthsExperience ? ` · ${provider.monthsExperience} ${copy.monthsExperience}` : ""}
              </p>
            </div>
          </div>
          {provider.introduction ? (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {provider.introduction}
            </p>
          ) : null}
        </section>
        <section>
          <h2 className="text-xl font-black">{copy.activeServices}</h2>
          {services.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <article key={service.publicId} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-black uppercase text-primary">
                    {t.core.modes[service.mode as keyof typeof t.core.modes] ?? service.mode}
                  </p>
                  <h3 className="mt-1 font-black">{service.title}</h3>
                  <p className="mt-3 text-xs text-slate-500">
                    {service.location.regionLabel || t.core.common.approximateArea} · {service.currency}
                  </p>
                  <Link
                    href={`${prefix}/services/${encodeURIComponent(service.publicId)}`}
                    className="mt-4 inline-flex text-sm font-black text-primary underline"
                  >
                    {copy.viewService}
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              {lang === "zh" ? "暂未发布服务" : lang === "ja" ? "サービスはまだ公開されていません" : "No active services yet"}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
