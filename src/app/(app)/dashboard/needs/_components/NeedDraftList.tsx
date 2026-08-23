"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePenLine, Trash2 } from "lucide-react";

import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { trpc } from "@/utils/trpc";

function draftPetNames(payload: Record<string, unknown>) {
  const workspace = payload.workspace;
  const workspacePets =
    workspace && typeof workspace === "object" && "common" in workspace
      ? (workspace.common as { pets?: unknown } | null)?.pets
      : undefined;
  const candidates = Array.isArray(payload.pets)
    ? payload.pets
    : Array.isArray(workspacePets)
      ? workspacePets
      : [];

  return Array.from(
    new Set(
      candidates.flatMap((candidate) => {
        if (!candidate || typeof candidate !== "object" || !("name" in candidate)) return [];
        const name = candidate.name;
        return typeof name === "string" && name.trim() ? [name.trim()] : [];
      }),
    ),
  );
}

export function NeedDashboardSignIn() {
  const copy = useNeedPublishingMessages().dashboardNeeds;
  return <main className="h-full overflow-y-auto p-6">{copy.signIn}</main>;
}

export function NeedDraftPanel() {
  const copy = useNeedPublishingMessages().dashboardNeeds;
  return (
    <section className="h-full w-full space-y-4 overflow-y-auto p-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
        <h1 className="text-2xl font-black text-slate-900">{copy.myDrafts}</h1>
        <div className="flex items-center gap-2 text-xs font-bold">
          <Link href="/dashboard/needs" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-600">{copy.userRequests}</Link>
          <Link href="/needs/create" className="rounded-full bg-primary px-3 py-1.5 text-white">{copy.create}</Link>
        </div>
      </div>
      <NeedDraftList />
    </section>
  );
}

export function NeedDraftList() {
  const { t, lang } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const router = useRouter();
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const copy = needMessages.dashboardNeeds;
  const utils = trpc.useUtils();
  const drafts = trpc.publishDraft.listMine.useQuery({
    kind: "NEED",
    includeAbandoned: false,
  });
  const abandon = trpc.publishDraft.abandon.useMutation({
    onSuccess: () => utils.publishDraft.listMine.invalidate(),
  });

  const discard = async (id: string) => {
    const accepted = await confirm({
      title: copy.draftDiscard,
      confirmText: copy.draftDiscard,
      cancelText: t.core.common.cancel,
      variant: "danger",
      content: <p>{copy.draftDiscard}</p>,
    });
    if (!accepted) return;
    try {
      await abandon.mutateAsync({ id });
    } finally {
      closeConfirm();
    }
  };

  if (drafts.isLoading) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{t.core.management.loadingRequests}</p>;
  }
  if (drafts.error) {
    return <p role="alert" className="rounded-2xl border border-danger-border bg-danger-bg p-6 text-sm text-danger-text">{t.core.management.requestsError}</p>;
  }
  const items = drafts.data ?? [];
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <FilePenLine className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-700">{copy.draftEmpty}</p>
        <Link href="/needs/create" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">
          {copy.create}
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((draft) => {
        const petNames = draftPetNames(draft.payload);
        const mode = draft.mode
          ? t.core.modes[draft.mode as keyof typeof t.core.modes] ?? draft.mode
          : copy.draftNew;
        const kind = draft.editingNeedId ? copy.draftEdit : copy.draftNew;
        return (
          <article key={draft.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">{kind}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{mode}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-800">{copy.drafts} · {draft.currentStep}</p>
              {petNames.length > 0 ? (
                <p className="mt-1 truncate text-xs font-medium text-slate-600">{petNames.join(" · ")}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-400">
                {new Date(draft.updatedAt).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={draft.status !== "ACTIVE"}
                onClick={() =>
                  router.push(
                    draft.editingNeedId
                      ? `/needs/edit/${encodeURIComponent(draft.editingNeedId)}?draftId=${encodeURIComponent(draft.id)}`
                      : `/needs/create?draftId=${encodeURIComponent(draft.id)}`,
                  )
                }
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {copy.draftResume}
              </button>
              <button
                type="button"
                aria-label={copy.draftDiscard}
                title={copy.draftDiscard}
                disabled={abandon.isLoading}
                onClick={() => void discard(draft.id)}
                className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
