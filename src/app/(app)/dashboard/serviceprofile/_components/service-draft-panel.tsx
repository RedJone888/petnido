"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  HandHeart,
  Home,
  MapPin,
  PawPrint,
  ReceiptText,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useCallback, useMemo, useState, type ElementType } from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { DevelopmentBadge } from "../../_components/development-badge";

type SortKey = "mode" | "updatedAt" | "progress";
type SortDirection = "asc" | "desc";

const serviceSteps = [
  "mode",
  "basics",
  "care",
  "availability",
  "pricing",
  "review",
] as const;

const modeIcons: Record<string, ElementType> = {
  HOME_VISIT: Home,
  BOARDING: Warehouse,
  CUSTOM: HandHeart,
};

const modeThemes: Record<string, string> = {
  HOME_VISIT: "bg-emerald-600 text-white",
  BOARDING: "bg-amber-600 text-white",
  CUSTOM: "bg-violet-600 text-white",
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function serviceProgress(
  payload: Record<string, unknown>,
  mode: string | null,
  currentStep: string,
) {
  const completed = new Set<string>();
  const currentIndex = Math.max(0, serviceSteps.indexOf(currentStep as never));
  serviceSteps.slice(0, currentIndex).forEach((step) => completed.add(step));
  if (mode) completed.add("mode");
  if (
    typeof payload.title === "string" &&
    payload.title.trim() &&
    typeof payload.description === "string" &&
    payload.description.trim()
  ) {
    completed.add("basics");
  }
  if (
    (Array.isArray(payload.petPolicies) && payload.petPolicies.length > 0) ||
    (Array.isArray(payload.offerings) && payload.offerings.length > 0)
  ) {
    completed.add("care");
  }
  if (
    record(payload.location) ||
    (Array.isArray(payload.availabilityRules) &&
      payload.availabilityRules.length > 0)
  ) {
    completed.add("availability");
  }
  if (Array.isArray(payload.priceRules) && payload.priceRules.length > 0) {
    completed.add("pricing");
  }
  if (currentStep === "review") completed.add("review");
  const completedCount = serviceSteps.filter((step) => completed.has(step)).length;
  return {
    completedCount,
    progress: Math.round((completedCount / serviceSteps.length) * 100),
  };
}

export function ServiceDraftPanel() {
  const { lang, t } = useLanguage();
  const copy = {
    en: {
      title: "My service drafts",
      description: "Continue unfinished care services and review the information saved so far.",
      empty: "You do not have any service drafts.", create: "Create service", resume: "Continue editing", discard: "Discard",
      discardTitle: "Discard this service draft?", discardDescription: "The saved service information in this draft will be removed from your account.", discardWarning: "This action cannot be undone. You will need to recreate the service draft if you change your mind.",
      untitled: "Untitled service", saved: "Saved", type: "Service type", progress: "Draft progress", details: "Completed details", actions: "Actions", step: "{current} of {total} steps completed", newDraft: "New service", editDraft: "Editing a published service", policies: "pet policies", offerings: "offerings", prices: "price rules",
    },
    zh: {
      title: "我的服务草稿",
      description: "继续编辑尚未发布的照护服务，并查看目前已经保存的内容。",
      empty: "你还没有服务草稿。", create: "发布服务", resume: "继续编辑", discard: "放弃",
      discardTitle: "放弃这份服务草稿？", discardDescription: "这份草稿中已经保存的服务内容将从你的账号中移除。", discardWarning: "此操作无法撤销。如果之后仍需要这些内容，只能重新创建服务草稿。",
      untitled: "未命名服务", saved: "保存于", type: "服务类型", progress: "草稿进度", details: "已填写内容", actions: "操作", step: "已完成 {current}/{total} 步", newDraft: "新建服务", editDraft: "编辑已发布服务", policies: "项宠物条件", offerings: "项服务内容", prices: "项价格规则",
    },
    ja: {
      title: "サービスの下書き",
      description: "未公開のケアサービスを続け、これまでに保存した内容を確認できます。",
      empty: "サービスの下書きはありません。", create: "サービスを作成", resume: "編集を続ける", discard: "破棄",
      discardTitle: "このサービスの下書きを破棄しますか？", discardDescription: "この下書きに保存されたサービス情報はアカウントから削除されます。", discardWarning: "この操作は取り消せません。必要になった場合はサービスの下書きを作り直す必要があります。",
      untitled: "名称未設定のサービス", saved: "保存日時", type: "サービスの種類", progress: "下書きの進捗", details: "入力済みの内容", actions: "操作", step: "全{total}ステップ中{current}ステップ完了", newDraft: "新しいサービス", editDraft: "公開済みサービスを編集中", policies: "件のペット条件", offerings: "件のサービス内容", prices: "件の料金ルール",
    },
  }[lang];
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const utils = trpc.useUtils();
  const drafts = trpc.publishDraft.listMine.useQuery({ kind: "SERVICE", includeAbandoned: false });
  const abandon = trpc.publishDraft.abandon.useMutation({ onSuccess: () => utils.publishDraft.listMine.invalidate() });
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const modeLabel = useCallback(
    (mode: string | null) =>
      mode
        ? t.core.servicePublishing.modes[
            mode as keyof typeof t.core.servicePublishing.modes
          ] ?? mode
        : "",
    [t],
  );

  const items = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...(drafts.data ?? [])].sort((left, right) => {
      let comparison = 0;
      if (sortKey === "mode") comparison = modeLabel(left.mode).localeCompare(modeLabel(right.mode), lang);
      else if (sortKey === "progress") comparison = serviceProgress(left.payload, left.mode, left.currentStep).progress - serviceProgress(right.payload, right.mode, right.currentStep).progress;
      else comparison = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      if (comparison !== 0) return comparison * direction;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }, [drafts.data, lang, modeLabel, sortDirection, sortKey]);

  const changeSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "mode" ? "asc" : "desc");
  };

  const SortIndicator = ({ sort }: { sort: SortKey }) => {
    if (sortKey !== sort) return <ArrowUpDown size={12} />;
    return sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  async function discard(draft: NonNullable<typeof drafts.data>[number]) {
    const accepted = await confirm({
      title: copy.discardTitle,
      content: (
        <div className="space-y-3 text-left">
          <p>{copy.discardDescription}</p>
          <dl className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">{copy.type}</dt><dd className="font-semibold text-slate-800">{modeLabel(draft.mode) || copy.untitled}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">{copy.saved}</dt><dd className="text-right font-medium text-slate-700">{new Date(draft.updatedAt).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}</dd></div>
          </dl>
          <p className="text-sm font-medium text-danger-text">{copy.discardWarning}</p>
        </div>
      ),
      confirmText: copy.discard, cancelText: t.core.common.cancel, variant: "danger",
    });
    if (!accepted) return;
    try { await abandon.mutateAsync({ id: draft.id }); } finally { closeConfirm(); }
  }

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      <header className="flex h-auto shrink-0 flex-col justify-center border-b border-slate-200/70 px-2 py-3 md:h-[var(--dashboard-title-height)] md:py-0">
        <h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">{copy.title}</h1>
        <p className="mt-1 text-sm leading-5 text-slate-500">{copy.description}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 pt-4">
        <DevelopmentBadge />
        {drafts.isLoading ? <p className="border-y border-slate-200 bg-white p-6 text-sm text-slate-500">{t.core.common.loading}</p> : null}
        {!drafts.isLoading && !items.length ? (
          <section className="border-y border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">{copy.empty}</p>
            <Link href="/dashboard/serviceprofile/services/new" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white">{copy.create}</Link>
          </section>
        ) : null}
        {items.length ? (
          <div className="border-y border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 xl:hidden">
              {([["updatedAt", copy.saved], ["mode", copy.type], ["progress", copy.progress]] as const).map(([key, label]) => (
                <button key={key} type="button" aria-pressed={sortKey === key} onClick={() => changeSort(key)} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sortKey === key ? "border-primary/30 bg-primary/5 text-primary" : "border-slate-200 bg-white text-slate-500"}`}>{label}<SortIndicator sort={key} /></button>
              ))}
            </div>
            <div className="hidden grid-cols-[minmax(200px,0.9fr)_minmax(180px,0.75fr)_minmax(0,1.5fr)_auto] gap-4 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:grid">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => changeSort("mode")} className="inline-flex items-center gap-1 hover:text-slate-700">{copy.type}<SortIndicator sort="mode" /></button>
                <button type="button" onClick={() => changeSort("updatedAt")} className="inline-flex items-center gap-1 hover:text-slate-700">{copy.saved}<SortIndicator sort="updatedAt" /></button>
              </div>
              <button type="button" onClick={() => changeSort("progress")} className="inline-flex items-center gap-1 hover:text-slate-700">{copy.progress}<SortIndicator sort="progress" /></button>
              <span>{copy.details}</span><span className="text-right">{copy.actions}</span>
            </div>
            <div className="divide-y divide-slate-200">
              {items.map((draft) => {
                const payload = draft.payload;
                const label = modeLabel(draft.mode);
                const ModeIcon = modeIcons[draft.mode ?? ""] ?? HandHeart;
                const { completedCount, progress } = serviceProgress(payload, draft.mode, draft.currentStep);
                const currentStepLabel = t.core.servicePublishing.steps[draft.currentStep as keyof typeof t.core.servicePublishing.steps] ?? draft.currentStep;
                const title = typeof payload.title === "string" && payload.title.trim() ? payload.title.trim() : null;
                const location = record(payload.location);
                const regionLabel = typeof location?.regionLabel === "string" ? location.regionLabel : null;
                const policyCount = Array.isArray(payload.petPolicies) ? payload.petPolicies.length : 0;
                const offeringCount = Array.isArray(payload.offerings) ? payload.offerings.length : 0;
                const priceCount = Array.isArray(payload.priceRules) ? payload.priceRules.length : 0;
                const kind = draft.editingServiceId ? copy.editDraft : copy.newDraft;
                return (
                  <article key={draft.id} className="grid gap-4 px-3 py-3 transition-colors hover:bg-slate-50/70 md:grid-cols-2 xl:grid-cols-[minmax(200px,0.9fr)_minmax(180px,0.75fr)_minmax(0,1.5fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${modeThemes[draft.mode ?? ""] ?? "bg-slate-700 text-white"}`}><ModeIcon size={15} /></span>
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">{label ? <h2 className="truncate text-sm font-semibold text-slate-800">{label}</h2> : null}<span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">{kind}</span></div>
                          {title ? <p className="mt-0.5 truncate text-xs text-slate-500">{title}</p> : null}
                        </div>
                      </div>
                      <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500"><CalendarClock size={14} className="shrink-0 text-slate-400" /><span className="truncate">{copy.saved} {new Date(draft.updatedAt).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}</span></p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-600">{copy.progress}</span><span className="font-semibold tabular-nums text-primary">{progress}%</span></div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
                      <p className="mt-1.5 truncate text-[11px] text-slate-400">{copy.step.replace("{current}", String(completedCount)).replace("{total}", String(serviceSteps.length))}{currentStepLabel ? ` · ${currentStepLabel}` : ""}</p>
                    </div>
                    {regionLabel || policyCount || offeringCount || priceCount ? (
                      <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 md:col-span-2 xl:col-span-1">
                        {regionLabel ? <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /><span className="truncate">{regionLabel}</span></p> : null}
                        {policyCount ? <p className="flex items-center gap-2"><PawPrint size={14} className="text-slate-400" />{policyCount} {copy.policies}</p> : null}
                        {offeringCount ? <p className="flex items-center gap-2"><HandHeart size={14} className="text-slate-400" />{offeringCount} {copy.offerings}</p> : null}
                        {priceCount ? <p className="flex items-center gap-2"><ReceiptText size={14} className="text-slate-400" />{priceCount} {copy.prices}</p> : null}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1.5 md:col-span-2 md:justify-end xl:col-span-1 xl:col-start-4 xl:justify-start">
                      <Link href={`/dashboard/serviceprofile/services/new?resumeDraft=${encodeURIComponent(draft.id)}`} className="inline-flex min-h-8 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-xs hover:bg-primary/90">{copy.resume}</Link>
                      <button type="button" disabled={abandon.isLoading} onClick={() => void discard(draft)} aria-label={copy.discard} title={copy.discard} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"><Trash2 size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
