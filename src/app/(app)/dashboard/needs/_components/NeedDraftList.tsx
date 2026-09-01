"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  CalendarClock,
  FilePenLine,
  HandHeart,
  Home,
  MapPin,
  PawPrint,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useMemo, useState, type ElementType } from "react";

import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { trpc } from "@/utils/trpc";

const draftModeIcons: Record<string, ElementType> = {
  HOME_VISIT: Home,
  BOARDING: Warehouse,
  CUSTOM: HandHeart,
};

const draftModeThemes: Record<string, string> = {
  HOME_VISIT: "bg-emerald-600 text-white",
  BOARDING: "bg-amber-600 text-white",
  CUSTOM: "bg-violet-600 text-white",
};

const draftStepsByMode: Record<string, string[]> = {
  HOME_VISIT: ["care", "pets", "dates", "tasks", "area", "budget", "preview"],
  BOARDING: [
    "care",
    "pets",
    "dates",
    "tasks",
    "supplies",
    "requirements",
    "area",
    "budget",
    "preview",
  ],
  CUSTOM: [
    "care",
    "pets",
    "dates",
    "tasks",
    "requirements",
    "area",
    "budget",
    "preview",
  ],
};

function draftPets(payload: Record<string, unknown>) {
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

  return candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const pet = candidate as Record<string, unknown>;
    const name = typeof pet.name === "string" ? pet.name.trim() : "";
    const rawType =
      typeof pet.petType === "string"
        ? pet.petType
        : typeof pet.typeCode === "string"
          ? pet.typeCode
          : typeof pet.type === "string"
            ? pet.type
            : "OTHER";
    const quantity =
      typeof pet.quantity === "number" && pet.quantity > 0 ? pet.quantity : 1;
    return [{ name, petType: rawType.toUpperCase(), quantity }];
  });
}

function draftPetNames(payload: Record<string, unknown>) {
  return Array.from(
    new Set(
      draftPets(payload).flatMap((pet) => (pet.name ? [pet.name] : [])),
    ),
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function draftDetails(
  payload: Record<string, unknown>,
  mode: string | null,
) {
  const workspace = asRecord(payload.workspace);
  const draftByMode = asRecord(workspace?.draftByMode);
  const branchKey =
    mode === "BOARDING" ? "boarding" : mode === "CUSTOM" ? "custom" : "visit";
  const branch = asRecord(draftByMode?.[branchKey]);
  const branchDates = asRecord(branch?.dates);
  const location = asRecord(payload.location) ?? asRecord(branch?.location);

  return {
    startsAt:
      nonEmptyString(payload.startsAt) ?? nonEmptyString(branchDates?.startDate),
    endsAt:
      nonEmptyString(payload.endsAt) ?? nonEmptyString(branchDates?.endDate),
    regionLabel:
      nonEmptyString(location?.regionLabel) ?? nonEmptyString(branch?.area),
  };
}

function confirmedDraftSteps(
  payload: Record<string, unknown>,
  mode: string | null,
) {
  const workspace = asRecord(payload.workspace);
  const common = asRecord(workspace?.common);
  const draftByMode = asRecord(workspace?.draftByMode);
  const branchKey =
    mode === "BOARDING" ? "boarding" : mode === "CUSTOM" ? "custom" : "visit";
  const branch = asRecord(draftByMode?.[branchKey]);
  const values = [common?.confirmedScreenIds, branch?.confirmedScreenIds];

  return new Set(
    values.flatMap((value) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [],
    ),
  );
}

function draftProgress(
  payload: Record<string, unknown>,
  mode: string | null,
  currentStep: string,
) {
  const steps = draftStepsByMode[mode ?? "HOME_VISIT"];
  const completed = confirmedDraftSteps(payload, mode);
  const normalizedCurrentStep =
    currentStep === "frequency"
      ? "dates"
      : currentStep === "cautions"
        ? "requirements"
        : currentStep;
  const currentIndex = steps.indexOf(normalizedCurrentStep);

  // Reaching a later step means the preceding steps passed navigation
  // validation, including for older drafts that predate confirmedScreenIds.
  if (currentIndex > 0) {
    steps.slice(0, currentIndex).forEach((step) => completed.add(step));
  }

  const details = draftDetails(payload, mode);
  if (mode) completed.add("care");
  if (draftPets(payload).length > 0) completed.add("pets");
  if (details.startsAt && details.endsAt) completed.add("dates");
  if (details.regionLabel) completed.add("area");
  if (normalizedCurrentStep === "preview") completed.add("preview");

  const completedStepCount = steps.filter((step) => completed.has(step)).length;
  return {
    steps,
    completedStepCount,
    progress: Math.round((completedStepCount / steps.length) * 100),
  };
}

type DraftSortKey = "mode" | "updatedAt" | "progress";
type DraftSortDirection = "asc" | "desc";

function formatDraftDate(value: string, lang: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? "UTC" : undefined,
  }).format(date);
}

export function NeedDashboardSignIn() {
  const copy = useNeedPublishingMessages().dashboardNeeds;
  return <main className="h-full overflow-y-auto p-6">{copy.signIn}</main>;
}

export function NeedDraftPanel() {
  const copy = useNeedPublishingMessages().dashboardNeeds;
  return (
    <section className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex h-auto shrink-0 flex-col justify-center border-b border-slate-200/70 px-2 py-3 md:h-[var(--dashboard-title-height)] md:py-0">
        <h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">{copy.myDrafts}</h1>
        <p className="mt-1 text-sm leading-5 text-slate-500">{copy.draftDescription}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 pt-4">
        <NeedDraftList />
      </div>
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
  const [sortKey, setSortKey] = useState<DraftSortKey>("updatedAt");
  const [sortDirection, setSortDirection] =
    useState<DraftSortDirection>("desc");

  const items = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...(drafts.data ?? [])].sort((left, right) => {
      let comparison = 0;
      if (sortKey === "mode") {
        const leftLabel = left.mode
          ? t.core.modes[left.mode as keyof typeof t.core.modes] ?? left.mode
          : "";
        const rightLabel = right.mode
          ? t.core.modes[right.mode as keyof typeof t.core.modes] ?? right.mode
          : "";
        comparison = leftLabel.localeCompare(rightLabel, lang);
      } else if (sortKey === "progress") {
        comparison =
          draftProgress(left.payload, left.mode, left.currentStep).progress -
          draftProgress(right.payload, right.mode, right.currentStep).progress;
      } else {
        comparison =
          new Date(left.updatedAt).getTime() -
          new Date(right.updatedAt).getTime();
      }
      if (comparison !== 0) return comparison * direction;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }, [drafts.data, lang, sortDirection, sortKey, t]);

  const changeSort = (nextKey: DraftSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "mode" ? "asc" : "desc");
  };

  const SortIndicator = ({ sort }: { sort: DraftSortKey }) => {
    if (sortKey !== sort) return <ArrowUpDown size={12} />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} />
    ) : (
      <ArrowDown size={12} />
    );
  };

  const discard = async (draft: NonNullable<typeof drafts.data>[number]) => {
    const modeLabel = draft.mode
      ? t.core.modes[draft.mode as keyof typeof t.core.modes] ?? draft.mode
      : copy.draftNew;
    const accepted = await confirm({
      title: copy.draftDiscardTitle,
      confirmText: copy.draftDiscard,
      cancelText: t.core.common.cancel,
      variant: "danger",
      content: (
        <div className="space-y-3 text-left">
          <p>{copy.draftDiscardDescription}</p>
          <dl className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{copy.draftType}</dt>
              <dd className="font-semibold text-slate-800">{modeLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{copy.draftSaved}</dt>
              <dd className="text-right font-medium text-slate-700">
                {new Date(draft.updatedAt).toLocaleString(lang, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          </dl>
          <p className="text-sm font-medium text-danger-text">
            {copy.draftDiscardWarning}
          </p>
        </div>
      ),
    });
    if (!accepted) return;
    try {
      await abandon.mutateAsync({ id: draft.id });
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
    <div className="border-y border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2 xl:hidden">
        {([
          ["updatedAt", copy.draftSaved],
          ["mode", copy.draftType],
          ["progress", copy.draftProgress],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={sortKey === key}
            onClick={() => changeSort(key)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              sortKey === key
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {label}
            <SortIndicator sort={key} />
          </button>
        ))}
      </div>
      <div className="hidden grid-cols-[minmax(180px,0.8fr)_minmax(180px,0.75fr)_minmax(0,1.5fr)_auto] gap-4 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:grid">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={sortKey === "mode"}
            onClick={() => changeSort("mode")}
            className="inline-flex items-center gap-1 transition hover:text-slate-700"
          >
            {copy.draftType}
            <SortIndicator sort="mode" />
          </button>
          <button
            type="button"
            aria-pressed={sortKey === "updatedAt"}
            onClick={() => changeSort("updatedAt")}
            className="inline-flex items-center gap-1 transition hover:text-slate-700"
          >
            {copy.draftSaved}
            <SortIndicator sort="updatedAt" />
          </button>
        </div>
        <button
          type="button"
          aria-pressed={sortKey === "progress"}
          onClick={() => changeSort("progress")}
          className="inline-flex items-center gap-1 transition hover:text-slate-700"
        >
          {copy.draftProgress}
          <SortIndicator sort="progress" />
        </button>
        <span>{copy.draftDetails}</span>
        <span className="text-right">{copy.draftActions}</span>
      </div>
      <div className="divide-y divide-slate-200">
        {items.map((draft) => {
        const pets = draftPets(draft.payload);
        const petNames = draftPetNames(draft.payload);
        const mode = draft.mode
          ? t.core.modes[draft.mode as keyof typeof t.core.modes] ?? draft.mode
          : null;
        const kind = draft.editingNeedId ? copy.draftEdit : copy.draftNew;
        const ModeIcon = draftModeIcons[draft.mode ?? ""] ?? FilePenLine;
        const petCount = pets.reduce((sum, pet) => sum + pet.quantity, 0);
        const petTypes = Array.from(
          new Set(
            pets.map(
              (pet) =>
                t.core.pets[pet.petType as keyof typeof t.core.pets] ??
                pet.petType,
            ),
          ),
        );
        const stepLabel =
          needMessages.needPublishing.steps[
            draft.currentStep as keyof typeof needMessages.needPublishing.steps
          ] ?? draft.currentStep;
        const { steps, completedStepCount, progress } = draftProgress(
          draft.payload,
          draft.mode,
          draft.currentStep,
        );
        const details = draftDetails(draft.payload, draft.mode);
        const schedule =
          details.startsAt && details.endsAt
            ? `${formatDraftDate(details.startsAt, lang)} – ${formatDraftDate(details.endsAt, lang)}`
            : null;
        return (
          <article
            key={draft.id}
            className="grid gap-4 px-3 py-3 transition-colors hover:bg-slate-50/70 md:grid-cols-2 xl:grid-cols-[minmax(180px,0.8fr)_minmax(180px,0.75fr)_minmax(0,1.5fr)_auto] xl:items-center"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                {mode ? (
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${draftModeThemes[draft.mode ?? ""] ?? "bg-slate-700 text-white"}`}
                  >
                    <ModeIcon size={15} />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {mode ? (
                      <h2 className="truncate text-sm font-semibold text-slate-800">
                        {mode}
                      </h2>
                    ) : null}
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                      {kind}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                <CalendarClock size={14} className="shrink-0 text-slate-400" />
                <span className="truncate">
                  {copy.draftSaved}{" "}
                  {new Date(draft.updatedAt).toLocaleString(lang, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </p>
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-600">
                  {copy.draftProgress}
                </span>
                <span className="font-semibold tabular-nums text-primary">
                  {progress}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 truncate text-[11px] text-slate-400">
                {copy.draftStep
                  .replace("{current}", String(completedStepCount))
                  .replace("{total}", String(steps.length))}
                {stepLabel ? ` · ${stepLabel}` : ""}
              </p>
            </div>

            {pets.length > 0 || schedule || details.regionLabel ? (
              <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 md:col-span-2 xl:col-span-1">
                {pets.length > 0 ? (
                  <p className="flex items-center gap-2">
                    <PawPrint size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                      <span className="font-semibold text-slate-700">
                        {petNames.join(", ") || petTypes.join(", ")}
                      </span>
                      <span className="text-slate-400">
                        {" · "}{petTypes.join(", ")} · {petCount}{" "}
                        {t.core.management.actions.pets}
                      </span>
                    </span>
                  </p>
                ) : null}
                {schedule ? (
                  <p className="flex items-center gap-2">
                    <CalendarDays size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{schedule}</span>
                  </p>
                ) : null}
                {details.regionLabel ? (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{details.regionLabel}</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-1.5 md:col-span-2 xl:col-span-1 xl:col-start-4 xl:justify-start">
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
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
              >
                {copy.draftResume}
              </button>
              <button
                type="button"
                aria-label={copy.draftDiscard}
                title={copy.draftDiscard}
                disabled={abandon.isLoading}
                onClick={() => void discard(draft)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}
