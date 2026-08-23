"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  PiCalendarBlank,
  PiMapPinLine,
  PiPawPrint,
  PiCurrencyCircleDollar,
  PiClock,
  PiHouseLine,
  PiWarehouse,
  PiHandHeart,
} from "react-icons/pi";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { mapNeedDraftPayloadToLegacyNeedDraftV3 } from "@/domain/publishing/legacy-need-draft-v3";
import { NEED_DRAFT_STORAGE_KEY } from "@/modules/need-publishing/client";
import { AppImage } from "@/components/ui/app-image";
import cn from "@/lib/cn";
import { buildNeedDisplayTitle } from "@/modules/need-publishing/domain/display-title";
import { localizeTaskLabel } from "@/modules/need-publishing/domain/task-catalog";

const modeIcons: Record<string, React.ElementType> = {
  HOME_VISIT: PiHouseLine,
  BOARDING: PiWarehouse,
  CUSTOM: PiHandHeart,
};

function StatusPill({ state, expired }: { state: string; expired?: boolean }) {
  const { t } = useLanguage();
  const effective = expired && state === "OPEN" ? "EXPIRED" : state;
  const label = expired && state === "OPEN"
    ? t.core.states.EXPIRED
    : (t.core.states[state as keyof typeof t.core.states] ?? state);

  const style: Record<string, string> = {
    OPEN: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    EXPIRED: "bg-amber-50 text-amber-800 border border-amber-200",
    MATCHED: "bg-purple-50 text-purple-800 border border-purple-200",
    CLOSED: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  const dot: Record<string, string> = {
    OPEN: "bg-emerald-500",
    EXPIRED: "bg-amber-500",
    MATCHED: "bg-purple-500",
    CLOSED: "bg-slate-400",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", style[effective] ?? style.CLOSED)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot[effective] ?? "bg-slate-400")} />
      {label}
    </span>
  );
}

export default function NeedV2OwnerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const actions = t.core.management.actions;
  const copy = needMessages.dashboardNeedDetail;
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const setConfirmLoading = useConfirmStore((state) => state.setIsDeleting);

  const utils = trpc.useUtils();
  const need = trpc.needV2.getMine.useQuery({ id: params.id });
  const reuseNeed = trpc.needV2.reuse.useMutation();
  const command = trpc.needV2.executeCommand.useMutation({
    onSuccess: () => utils.needV2.getMine.invalidate({ id: params.id }),
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const item = need.data;
  const displayTitle = item
    ? buildNeedDisplayTitle({ mode: item.mode, pets: item.pets, lang })
    : "";
  const isExpired =
    item?.state === "OPEN" &&
    (item.expired ?? new Date(item.endsAt) <= new Date());

  const edit = () => {
    if (!item) return;
    setActionError(null);
    if (item.state === "MATCHED") {
      setActionError(actions.matchedEditBlocked);
      return;
    }
    if (item.state !== "OPEN" && item.state !== "CLOSED") {
      setActionError(actions.editUnavailable);
      return;
    }
    router.push(`/needs/edit/${item.id}`);
  };

  const handleCancelMatch = async () => {
    if (!item) return;
    setActionError(null);
    const accepted = await confirm({
      title: actions.cancelMatchQuestion,
      confirmText: actions.cancelMatch,
      cancelText: t.core.common.cancel,
      variant: "danger",
      content: <p>{actions.cancelMatchDetail}</p>,
    });
    if (!accepted) return;
    setConfirmLoading(true);
    try {
      await command.mutateAsync({ id: item.id, command: "CANCEL_MATCH", expectedUpdatedAt: new Date(item.updatedAt) });
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const handleReuse = async () => {
    if (!item) return;
    setActionError(null);
    const draftId = crypto.randomUUID();
    try {
      const input = { id: item.id, draftId };
      const draft = await reuseNeed.mutateAsync(input).catch(() =>
        reuseNeed.mutateAsync(input),
      );
      router.push(`/needs/create?draftId=${encodeURIComponent(draft.id)}`);
    } catch {
      setActionError(actions.changedElsewhere);
    }
  };

  const handleClose = async () => {
    if (!item) return;
    setActionError(null);
    const accepted = await confirm({
      title: actions.closeQuestion,
      confirmText: actions.close,
      cancelText: t.core.common.cancel,
      variant: "primary",
      content: <p>{actions.closeDetail}</p>,
    });
    if (!accepted) return;
    setConfirmLoading(true);
    try {
      await command.mutateAsync({ id: item.id, command: "CLOSE", expectedUpdatedAt: new Date(item.updatedAt) });
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  const handleReopen = async () => {
    if (!item) return;
    setActionError(null);
    if (item.expired) { setActionError(actions.reopenExpired); return; }
    try {
      await command.mutateAsync({ id: item.id, command: "REOPEN", expectedUpdatedAt: new Date(item.updatedAt) });
    } catch {
      setActionError(actions.changedElsewhere);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setActionError(null);
    const accepted = await confirm({
      title: actions.deleteQuestion,
      confirmText: actions.delete,
      cancelText: t.core.common.cancel,
      variant: "danger",
      content: <p>{actions.deleteDetail}</p>,
    });
    if (!accepted) return;
    setConfirmLoading(true);
    try {
      await command.mutateAsync({ id: item.id, command: "ARCHIVE", expectedUpdatedAt: new Date(item.updatedAt) });
      window.location.assign("/dashboard/needs");
    } catch {
      setActionError(actions.changedElsewhere);
    } finally {
      setConfirmLoading(false);
      closeConfirm();
    }
  };

  if (need.isLoading) {
    return (
      <div className="p-8 text-sm text-slate-400 animate-pulse">{copy.loading}</div>
    );
  }
  if (need.error || !item) {
    return (
      <div className="p-8">
        <div role="alert" className="rounded-2xl border border-danger-border bg-danger-bg p-5 text-sm text-danger-text">
          {copy.unavailable}
        </div>
      </div>
    );
  }

  const ModeIcon = modeIcons[item.mode] ?? PiHandHeart;
  const modeName = t.core.modes[item.mode as keyof typeof t.core.modes] ?? item.mode;
  const coverPhoto = item.pets[0]?.image ?? item.attachments[0]?.attachment?.url ?? null;

  const startDate = new Date(item.startsAt).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });
  const endDate = new Date(item.endsAt).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });
  const publishedDate = new Date(item.createdAt).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Top bar: back + actions (Fixed, non-scrolling) */}
      <div className="shrink-0 pb-3 border-b border-slate-200/80 bg-[#f6f7fb]">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-2">
          <Link
            href="/dashboard/needs"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] transition hover:opacity-80"
          >
            <ArrowLeft size={16} />
            <span>{copy.back}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {actionError && (
              <span className="text-xs text-red-500">{actionError}</span>
            )}
            <button
              type="button"
              disabled={command.isLoading || reuseNeed.isLoading}
              onClick={() => void edit()}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {actions.edit}
            </button>
            {item.state === "CLOSED" ? (
              <button
                type="button"
                disabled={command.isLoading || new Date(item.endsAt) <= new Date()}
                onClick={() => void handleReopen()}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actions.reopen}
              </button>
            ) : item.state === "MATCHED" ? (
              <button
                type="button"
                disabled={command.isLoading}
                onClick={() => void handleCancelMatch()}
                className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-40"
              >
                {actions.cancelMatch}
              </button>
            ) : (
              <button
                type="button"
                disabled={command.isLoading || isExpired}
                onClick={() => void handleClose()}
                className="rounded-xl border border-[#cfc4d7] px-4 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actions.close}
              </button>
            )}
            <button
              type="button"
              disabled={command.isLoading}
              onClick={() => void handleDelete()}
              className="rounded-xl border border-danger-border px-4 py-2 text-xs font-bold text-danger-text transition hover:bg-danger-bg disabled:opacity-50"
            >
              {actions.delete}
            </button>
            <button
              type="button"
              disabled={reuseNeed.isLoading || command.isLoading}
              onClick={() => void handleReuse()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
            >
              {actions.reuse}
            </button>
          </div>
        </div>
      </div>

      {/* Lower scrollable body */}
      <div className="flex-1 overflow-y-auto py-5 pr-1 pb-10">
        <div className="mx-auto w-full max-w-3xl space-y-6">

      {/* Hero: cover photo + title */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Cover photo */}
        <div className="relative h-52 w-full bg-[#fff8e8]">
          {coverPhoto ? (
            <AppImage src={coverPhoto} alt={displayTitle} width={800} height={400} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#f5f0ff] to-[#e8f5e9]" />
          )}
          {/* Mode badge */}
          <div className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black shadow-md backdrop-blur-md",
            item.mode === "HOME_VISIT" ? "bg-emerald-600 text-white" :
            item.mode === "BOARDING" ? "bg-amber-600 text-white" :
            "bg-violet-600 text-white"
          )}>
            <ModeIcon size={13} className="shrink-0" />
            <span>{modeName}</span>
          </div>
        </div>

        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900">{displayTitle}</h1>
            <p className="mt-1 text-xs text-slate-400">
              {needMessages.dashboardNeeds.publishedAt}{publishedDate}
            </p>
          </div>
          <StatusPill state={item.state} expired={isExpired} />
        </div>
      </div>

      {/* Key info grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
          <PiCalendarBlank size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{copy.schedule}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{startDate}</p>
            {startDate !== endDate && (
              <p className="text-sm text-slate-500">→ {endDate}</p>
            )}
            {item.mode === "CUSTOM" && item.customTimePreference ? (
              <p className="mt-1 text-xs text-slate-500">
                {needMessages.needPublishing.timeOptions[
                  item.customTimePreference.toLowerCase() as keyof typeof needMessages.needPublishing.timeOptions
                ] ?? item.customTimePreference}
                {item.customExactTime ? ` · ${item.customExactTime}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
          <PiMapPinLine size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{copy.mapLocation}</p>
            <p className="mt-1 text-sm font-medium text-slate-800 truncate">
              {item.locationSnapshot.regionLabel || copy.savedMapPoint}
            </p>
            {item.locationSnapshot.displayPrecision ? (
              <p className="text-xs text-slate-500">{item.locationSnapshot.displayPrecision}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
          <PiCurrencyCircleDollar size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{copy.budget}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {item.minAmountMinor !== null
                ? `${item.currency} ${(item.minAmountMinor / 100).toLocaleString()}`
                : "—"}
              {item.maxAmountMinor !== null
                ? ` – ${(item.maxAmountMinor / 100).toLocaleString()}`
                : ""}
            </p>
            {item.negotiable ? <p className="text-xs text-slate-500">{copy.negotiable}</p> : null}
          </div>
        </div>
      </div>

      {item.scheduleNotes ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            {lang === "zh" ? "时间备注" : lang === "ja" ? "時間に関するメモ" : "Schedule notes"}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
            {item.scheduleNotes}
          </p>
        </div>
      ) : null}

      {/* Description */}
      {item.description ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">About</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-line">{item.description}</p>
        </div>
      ) : null}

      {/* Pets */}
      {item.pets.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wide">
            <PiPawPrint size={15} />
            {copy.pets}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 normal-case font-bold">
              {item.pets.length}
            </span>
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {item.pets.map((pet) => (
              <div key={pet.id} className="flex items-center gap-3 rounded-xl bg-[#faf7fb] p-3">
                {pet.image ? (
                  <AppImage src={pet.image} alt={pet.name ?? ""} width={48} height={48} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-slate-900 truncate">{pet.name || "—"}</p>
                    <span className="text-xs font-bold text-[var(--primary)] shrink-0">
                      {t.core.pets[pet.petType as keyof typeof t.core.pets] ?? pet.petType}
                      {pet.quantity > 1 ? ` ×${pet.quantity}` : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">
                    {[pet.breed, pet.sex, pet.neutered].filter(Boolean).join(" · ") || copy.noPetDetails}
                  </p>
                  {pet.careNotes ? (
                    <p className="mt-1 text-xs leading-5 text-slate-600 line-clamp-2">{pet.careNotes}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      {item.tasks.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wide">
            <PiClock size={15} />
            {copy.careTasks}
          </h2>
          <div className="mt-4 space-y-2">
            {item.tasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-slate-900">
                    {localizeTaskLabel(task.label, lang, {
                      category: task.category,
                      custom:
                        task.category.toUpperCase() === "CUSTOM" ||
                        task.category.toUpperCase().startsWith("CUSTOM-"),
                    })}
                  </p>
                  <span className="text-xs font-bold text-[#8a5d34]">
                    {task.scheduleKind} · {task.priority}
                  </span>
                </div>
                {task.instructions ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{task.instructions}</p>
                ) : null}
                {task.visitNumbers.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-400">
                    {task.visitNumbers.map((v) => copy.visit.replace("{n}", String(v))).join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage applications link */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] transition hover:opacity-80"
        >
          {copy.manageApplications} →
        </Link>
      </div>
        </div>
      </div>
    </div>
  );
}
