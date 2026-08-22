"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { trpc } from "@/utils/trpc";

const CommonPieChart = dynamic(() => import("@/components/ui/common-pie-chart"), { ssr: false });

export default function NeedsChart() {
  const summary = trpc.dashboardSummary.getMine.useQuery();
  const data = summary.data;
  if (!data) return <section className="min-h-72 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-slate-500">{summary.error ? "依頼状況を読み込めませんでした。" : "依頼状況を読み込み中…"}</section>;
  if (!data.totals.needs) return <section className="grid min-h-72 place-items-center rounded-2xl border border-neutral-200 bg-white p-8 text-center"><div><p className="font-black text-slate-800">まだ依頼はありません</p><p className="mt-2 text-sm text-slate-500">依頼を公開すると状態と種類をここで確認できます。</p><Link href="/needs/create" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-black text-white">依頼を作成</Link></div></section>;
  const typeData = [
    { name: "シッター訪問", value: data.needByMode.HOME_VISIT },
    { name: "ペット預かり", value: data.needByMode.BOARDING },
    { name: "その他", value: data.needByMode.CUSTOM },
  ].filter((item) => item.value > 0);
  const statusData = [
    { name: "募集中", value: data.needStates.OPEN },
    { name: "決定済み", value: data.needStates.MATCHED },
    { name: "終了", value: data.needStates.CLOSED },
    { name: "キャンセル", value: data.needStates.CANCELLED },
  ].filter((item) => item.value > 0);
  return <section className="rounded-2xl border border-neutral-200 bg-white px-6 py-4"><div className="mb-3 flex items-end justify-between"><h2 className="font-bold text-neutral-800">依頼状況</h2><span className="text-xs text-neutral-500">合計 {data.totals.needs} 件</span></div><div className="grid grid-cols-1 gap-2 md:grid-cols-2"><CommonPieChart height="250px" title="依頼カテゴリー" data={typeData} colors={["#F6658C", "#008E94", "#FFBF00"]} /><CommonPieChart height="250px" title="依頼ステータス" data={statusData} colors={["#0BDA51", "#B069DB", "#6D8196", "#FA5053"]} /></div></section>;
}
