"use client";

import Link from "next/link";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import { buildNeedDisplayTitle } from "@/modules/need-publishing/domain/display-title";

type RecommendationPanelProps =
  | { kind: "NEED"; id: string; compact?: boolean }
  | { kind: "SERVICE"; id: string; compact?: boolean };

type RecommendationMatch = { distanceMeters: number; reasons: string[]; relaxedCriteria: string[] };
type ServiceRecommendationItem = { match: RecommendationMatch; service: { publicId: string; mode: string; title: string } };
type NeedRecommendationItem = {
  match: RecommendationMatch;
  need: {
    publicId: string;
    source: "V2" | "LEGACY";
    mode: string;
    title: string;
    pets?: Array<{ name?: string | null; petType: string; customPetType?: string | null }>;
  };
};
type RecommendationData = { tier: string; message: string; items: Array<ServiceRecommendationItem | NeedRecommendationItem>; candidateWindowLimited?: boolean };

function Distance({ meters }: { meters: number }) {
  return <span>{meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`}</span>;
}

export function RecommendationPanel(props: RecommendationPanelProps) {
  const { t, lang } = useLanguage();
  const copy = t.core.recommendations;
  const needResult = trpc.matching.forNeed.useQuery(
    { id: props.id, limit: props.compact ? 3 : 6 },
    { enabled: props.kind === "NEED", retry: false },
  );
  const serviceResult = trpc.matching.forService.useQuery(
    { id: props.id, limit: props.compact ? 3 : 6 },
    { enabled: props.kind === "SERVICE", retry: false },
  );
  const query = props.kind === "NEED" ? needResult : serviceResult;

  if (query.isLoading) {
    return <section className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{copy.loading}</section>;
  }
  if (query.error) {
    return <section role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{copy.error}</section>;
  }
  const data = query.data as RecommendationData | undefined;
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4" aria-label={copy.aria}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-900">
            {data.tier === "EXACT" ? copy.exact : data.tier === "NONE" ? copy.none : copy.relaxed}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{data.message}</p>
        </div>
        {data.tier !== "NONE" ? <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-primary">{copy.resultCount.replace("{n}", String(data.items.length))}</span> : null}
      </div>

      {data.items.length ? (
        <div className="mt-3 space-y-3">
          {props.kind === "NEED"
            ? ((needResult.data?.items ?? []) as ServiceRecommendationItem[]).map(({ match, service }) => (
                <article key={service.publicId} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-black uppercase text-primary">{t.core.modes[service.mode as keyof typeof t.core.modes] ?? service.mode}</p><h3 className="mt-1 text-sm font-black text-slate-900">{service.title}</h3></div>
                    <span className="shrink-0 text-xs font-bold text-slate-500"><Distance meters={match.distanceMeters} /></span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{match.reasons.slice(0, 3).join(" · ")}</p>
                  {match.relaxedCriteria.map((notice) => <p key={notice} className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] leading-5 text-amber-900">{notice}</p>)}
                  <Link href={`/services/${encodeURIComponent(service.publicId)}`} className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-xs font-black text-white">{copy.viewService}</Link>
                </article>
              ))
            : ((serviceResult.data?.items ?? []) as NeedRecommendationItem[]).map(({ match, need }) => (
                <article key={need.publicId} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-black uppercase text-primary">{t.core.modes[need.mode as keyof typeof t.core.modes] ?? need.mode}</p><h3 className="mt-1 text-sm font-black text-slate-900">{need.source === "V2" ? buildNeedDisplayTitle({ mode: need.mode, pets: need.pets, lang }) : need.title}</h3></div>
                    <span className="shrink-0 text-xs font-bold text-slate-500"><Distance meters={match.distanceMeters} /></span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{match.reasons.slice(0, 3).join(" · ")}</p>
                  {match.relaxedCriteria.map((notice) => <p key={notice} className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] leading-5 text-amber-900">{notice}</p>)}
                  <Link href={`/needs/${encodeURIComponent(need.publicId)}`} className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-xs font-black text-white">{copy.viewNeed}</Link>
                </article>
              ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={props.kind === "NEED" ? "/services" : "/needs"} className="inline-flex min-h-10 items-center rounded-lg border border-primary bg-white px-4 text-xs font-black text-primary">
            {props.kind === "NEED" ? copy.browseServices : copy.browseNeeds}
          </Link>
        </div>
      )}
      {data.candidateWindowLimited ? <p className="mt-3 text-[11px] leading-5 text-slate-500">{copy.limited}</p> : null}
    </section>
  );
}
