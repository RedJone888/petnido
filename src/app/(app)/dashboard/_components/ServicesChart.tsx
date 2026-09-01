"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { trpc } from "@/utils/trpc";

const CommonPieChart = dynamic(() => import("@/components/ui/common-pie-chart"), { ssr: false });

export default function ServicesChart() {
  const summary = trpc.dashboardSummary.getMine.useQuery();
  const data = summary.data;
  if (!data) return <section className="min-h-72 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-slate-500">{summary.error ? "サービス状況を読み込めませんでした。" : "サービス状況を読み込み中…"}</section>;
  if (!data.totals.services) return <section className="grid min-h-72 place-items-center rounded-2xl border border-neutral-200 bg-white p-8 text-center"><div><p className="font-black text-slate-800">まだサービスはありません</p><p className="mt-2 text-sm text-slate-500">サービスプロフィールを作成して、提供できるケアを公開できます。</p><Link href="/dashboard/serviceprofile" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-black text-white">サービスを始める</Link></div></section>;
  const typeData = [
    { name: "シッター訪問", value: data.serviceByMode.HOME_VISIT },
    { name: "ペット預かり", value: data.serviceByMode.BOARDING },
    { name: "その他", value: data.serviceByMode.CUSTOM },
  ].filter((item) => item.value > 0);
  return <section className="rounded-2xl border border-neutral-200 bg-white px-6 py-4"><div className="mb-3 flex items-end justify-between"><h2 className="font-bold text-neutral-800">サービス状況</h2><span className="text-xs text-neutral-500">合計 {data.totals.services} 件</span></div><div className={`rounded-xl border p-3 ${data.serviceProfile.isAccepting ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"}`}><p className="text-xs font-bold">{data.serviceProfile.isAccepting ? "受付中" : "受付停止中"}</p><p className="mt-1 text-[10px]">公開中 {data.serviceStates.ACTIVE} 件 · 一時停止 {data.serviceStates.PAUSED} 件</p></div><CommonPieChart height="186px" title="サービスカテゴリー" data={typeData} colors={["#F6658C", "#008E94", "#FFBF00"]} titlePos={{ top: "20%", left: "58%" }} legendPos={{ top: "45%", left: "60%", orient: "vertical" }} chartCenter={["30%", "50%"]} chartRadius={["65%", "85%"]} /></section>;
}
