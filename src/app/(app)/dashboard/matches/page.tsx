"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RecommendationPanel } from "@/components/matching/recommendation-panel";
import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";

export default function DashboardMatches() {
  const { lang, t } = useLanguage();
  const copy = t.core.matching;
  const searchParams = useSearchParams();
  const needId = searchParams.get("needId");
  const serviceId = searchParams.get("serviceId");
  const needs = trpc.needV2.listMine.useQuery(undefined, { enabled: !needId && !serviceId });
  const services = trpc.serviceV2.listMine.useQuery(undefined, { enabled: !needId && !serviceId });

  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="mx-auto max-w-5xl w-full h-full flex flex-col overflow-hidden">
        {/* Fixed Top Header */}
        <header className="shrink-0 pb-3">
          <p className="text-xs font-black uppercase tracking-widest text-primary">{copy.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">{copy.title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{copy.intro}</p>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 pb-8">
          {needId ? <div className="mt-4"><RecommendationPanel kind="NEED" id={needId} /></div> : null}
          {serviceId ? <div className="mt-4"><RecommendationPanel kind="SERVICE" id={serviceId} /></div> : null}

          {!needId && !serviceId ? (
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">{copy.requestsSection}</h2>
            <div className="mt-4 space-y-3">
              {needs.data?.filter((need) => need.state === "OPEN" && !need.expired).map((need) => (
                <Link key={need.id} href={`/dashboard/matches?needId=${encodeURIComponent(need.id)}`} className="block rounded-xl border border-slate-200 p-4 hover:border-primary">
                  <p className="font-black text-slate-900">{need.title}</p><p className="mt-1 text-xs text-slate-500">{t.core.modes[need.mode as keyof typeof t.core.modes] ?? need.mode} · {copy.requestDeadline} {new Date(need.endsAt).toLocaleDateString(lang)}</p>
                </Link>
              ))}
              {!needs.isLoading && !needs.data?.some((need) => need.state === "OPEN" && !need.expired) ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{copy.noRequests}<Link href="/needs/create" className="ml-1 font-black text-primary underline">{copy.postRequest}</Link></p> : null}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">{copy.servicesSection}</h2>
            <div className="mt-4 space-y-3">
              {services.data?.filter((service) => service.state === "ACTIVE").map((service) => (
                <Link key={service.id} href={`/dashboard/matches?serviceId=${encodeURIComponent(service.id)}`} className="block rounded-xl border border-slate-200 p-4 hover:border-primary">
                  <p className="font-black text-slate-900">{service.title}</p><p className="mt-1 text-xs text-slate-500">{t.core.modes[service.mode as keyof typeof t.core.modes] ?? service.mode} · {service.currency}</p>
                </Link>
              ))}
              {!services.isLoading && !services.data?.some((service) => service.state === "ACTIVE") ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{copy.noServices}<Link href="/dashboard/serviceprofile/services/new" className="ml-1 font-black text-primary underline">{copy.postService}</Link></p> : null}
            </div>
          </section>
        </div>
      ) : null}
        </div>
      </div>
    </main>
  );
}
