"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  PublishingFlowShell,
  type PublishingStep,
} from "@/components/publishing/publishing-flow-shell";
import { usePublishDraft } from "@/components/publishing/use-publish-draft";
import { trpc } from "@/utils/trpc";

const stepOrder = ["basics", "pets", "location", "review"] as const;

export function PublishingDraftDemo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const [currentStep, setCurrentStep] = useState<(typeof stepOrder)[number]>("basics");
  const [title, setTitle] = useState("Untitled care request");
  const hydratedDraftId = useRef<string | null>(null);
  const draft = trpc.publishDraft.getMine.useQuery(
    { id: draftId ?? "00000000-0000-4000-8000-000000000000" },
    { enabled: Boolean(draftId), retry: false },
  );
  const persistence = usePublishDraft();

  useEffect(() => {
    if (!draftId || !draft.data || hydratedDraftId.current === draftId) return;
    hydratedDraftId.current = draftId;
    persistence.adoptRevision(draft.data.revision);
    if (stepOrder.includes(draft.data.currentStep as (typeof stepOrder)[number])) {
      setCurrentStep(draft.data.currentStep as (typeof stepOrder)[number]);
    }
    const savedTitle = draft.data.payload.title;
    if (typeof savedTitle === "string") setTitle(savedTitle);
  }, [draft.data, draftId, persistence]);

  const steps = useMemo<PublishingStep[]>(() => {
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder.map((id, index) => ({
      id,
      label: id[0].toUpperCase() + id.slice(1),
      state:
        index < currentIndex
          ? "complete"
          : index === currentIndex
            ? "current"
            : "available",
    }));
  }, [currentStep]);

  async function createDraft() {
    const id = crypto.randomUUID();
    await persistence.createDraft({
      id,
      kind: "NEED",
      mode: "HOME_VISIT",
      currentStep,
      payload: { title },
    });
    hydratedDraftId.current = id;
    router.replace(`/validation/publishing-draft?draft=${encodeURIComponent(id)}`);
  }

  async function saveDraft() {
    if (!draftId) return;
    await persistence.saveDraft({
      id: draftId,
      kind: "NEED",
      mode: "HOME_VISIT",
      currentStep,
      payload: { title },
    });
  }

  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <PublishingFlowShell
      eyebrow="Validation · Need draft"
      title="Create a care request"
      description="This non-production page exercises the shared publishing shell and real versioned draft API."
      steps={steps}
      saveState={draftId && draft.isLoading ? "saving" : persistence.saveState}
      onStepSelect={(id) => setCurrentStep(id as (typeof stepOrder)[number])}
      onPrevious={
        currentIndex > 0 ? () => setCurrentStep(stepOrder[currentIndex - 1]) : undefined
      }
      onNext={
        currentIndex < stepOrder.length - 1
          ? () => setCurrentStep(stepOrder[currentIndex + 1])
          : undefined
      }
      nextLabel={currentStep === "review" ? "Ready to publish" : "Continue"}
    >
      <div className="space-y-6">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-800">Request title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
            className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!draftId ? (
            <button
              type="button"
              onClick={createDraft}
              disabled={persistence.isPending}
              className="min-h-11 rounded-xl bg-slate-950 px-5 font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Create server draft
            </button>
          ) : (
            <button
              type="button"
              onClick={saveDraft}
              disabled={persistence.isPending || draft.isLoading}
              className="min-h-11 rounded-xl bg-slate-950 px-5 font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Save this step
            </button>
          )}
          <p className="break-all text-xs text-slate-500">
            {draftId
              ? `Draft ${draftId} · revision ${persistence.revision ?? "loading"}`
              : "No server draft exists yet."}
          </p>
        </div>
        {draft.error ? (
          <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-text">
            Draft could not be loaded.
          </p>
        ) : null}
      </div>
    </PublishingFlowShell>
  );
}
