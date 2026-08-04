"use client";

import type { ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Cloud, CloudAlert, Loader2 } from "lucide-react";

import cn from "@/lib/cn";

export type PublishingStep = {
  id: string;
  label: string;
  state: "complete" | "current" | "available" | "locked";
};

export type DraftSaveState = "idle" | "saving" | "saved" | "conflict" | "error";

const saveStateCopy: Record<DraftSaveState, string> = {
  idle: "Not saved yet",
  saving: "Saving draft…",
  saved: "Draft saved",
  conflict: "A newer draft exists. Reload before continuing.",
  error: "Draft could not be saved",
};

export function PublishingFlowShell({
  eyebrow,
  title,
  description,
  steps,
  saveState,
  onStepSelect,
  onPrevious,
  onNext,
  previousLabel = "Back",
  nextLabel = "Continue",
  nextDisabled = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  steps: PublishingStep[];
  saveState: DraftSaveState;
  onStepSelect?: (stepId: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="min-w-0 bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-w-0 max-w-6xl gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <p className="px-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <nav aria-label="Publishing steps" className="mt-4 overflow-x-auto lg:overflow-visible">
            <ol className="flex min-w-max gap-2 pb-1 lg:min-w-0 lg:flex-col">
              {steps.map((step, index) => {
                const selectable = step.state !== "locked" && Boolean(onStepSelect);
                return (
                  <li key={step.id} className="min-w-40 lg:min-w-0">
                    <button
                      type="button"
                      aria-current={step.state === "current" ? "step" : undefined}
                      disabled={!selectable}
                      onClick={() => onStepSelect?.(step.id)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        step.state === "current" && "bg-purple-100 text-purple-950",
                        step.state === "complete" && "bg-emerald-50 text-emerald-900",
                        step.state === "available" && "text-slate-700 hover:bg-slate-100",
                        step.state === "locked" && "cursor-not-allowed text-slate-400",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs",
                          step.state === "current" && "border-primary bg-primary text-white",
                          step.state === "complete" && "border-emerald-600 bg-emerald-600 text-white",
                          (step.state === "available" || step.state === "locked") &&
                            "border-slate-300 bg-white",
                        )}
                      >
                        {step.state === "complete" ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      <span>{step.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h1>
                {description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
                ) : null}
              </div>
              <DraftSaveStatus state={saveState} />
            </div>
          </header>

          <div className="min-w-0 px-5 py-6 sm:px-8">{children}</div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!onPrevious}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-bold text-slate-700 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              {previousLabel}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext || nextDisabled}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {nextLabel}
              <ChevronRight className="h-4 w-4" />
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

export function DraftSaveStatus({ state }: { state: DraftSaveState }) {
  const Icon = state === "saving" ? Loader2 : state === "error" || state === "conflict" ? CloudAlert : Cloud;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center gap-2 self-start rounded-full px-3 text-xs font-bold",
        state === "saved" && "bg-emerald-50 text-emerald-800",
        (state === "error" || state === "conflict") && "bg-rose-50 text-rose-800",
        (state === "idle" || state === "saving") && "bg-slate-100 text-slate-600",
      )}
    >
      <Icon className={cn("h-4 w-4", state === "saving" && "animate-spin")} />
      {saveStateCopy[state]}
    </div>
  );
}
