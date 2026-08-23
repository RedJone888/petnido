"use client";

import type { ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Cloud, CloudAlert, Loader2 } from "lucide-react";

import cn from "@/lib/cn";

export type PublishingStep = {
  id: string;
  label: string;
  state: "complete" | "current" | "available" | "attention" | "locked";
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
  onResolveConflict,
  children,
  saveStateLabels,
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
  onResolveConflict?: () => void;
  children: ReactNode;
  saveStateLabels?: Partial<Record<DraftSaveState, string>> & { conflictAction?: string };
}) {
  return (
    <main className="min-w-0 bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-w-0 max-w-6xl gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <p className="px-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <PublishingStepNavigation
            steps={steps}
            onStepSelect={onStepSelect}
            className="mt-4"
          />
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
              <DraftSaveStatus
                state={saveState}
                onResolveConflict={onResolveConflict}
                labels={saveStateLabels}
              />
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
              className="button-primary-raised inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

export function PublishingStepNavigation({
  steps,
  onStepSelect,
  className,
  orientation = "responsive",
}: {
  steps: PublishingStep[];
  onStepSelect?: (stepId: string) => void;
  className?: string;
  orientation?: "responsive" | "vertical";
}) {
  return (
    <nav
      aria-label="Publishing steps"
      className={cn(
        orientation === "responsive" && "overflow-x-auto lg:overflow-visible",
        className,
      )}
    >
      <ol
        className={cn(
          "flex gap-2 pb-1",
          orientation === "responsive"
            ? "min-w-max lg:min-w-0 lg:flex-col"
            : "min-w-0 flex-col",
        )}
      >
        {steps.map((step, index) => {
          const selectable = step.state !== "locked" && Boolean(onStepSelect);
          return (
            <li
              key={step.id}
              className={cn(
                orientation === "responsive" ? "min-w-40 lg:min-w-0" : "min-w-0",
              )}
            >
              <button
                type="button"
                aria-current={step.state === "current" ? "step" : undefined}
                aria-label={`${step.label}${step.state === "attention" ? ", needs attention" : ""}`}
                disabled={!selectable}
                onClick={() => onStepSelect?.(step.id)}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  step.state === "current" &&
                    "bg-primary-fixed text-on-primary-fixed-variant",
                  step.state === "complete" && "bg-emerald-50 text-emerald-900",
                  step.state === "available" && "text-slate-700 hover:bg-slate-100",
                  step.state === "attention" && "bg-danger-bg text-danger-text hover:bg-danger-bg",
                  step.state === "locked" && "cursor-not-allowed text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs",
                    step.state === "current" && "border-primary bg-primary text-white",
                    step.state === "complete" && "border-emerald-600 bg-emerald-600 text-white",
                    step.state === "attention" && "border-danger-text bg-white text-danger-text",
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
  );
}

export function DraftSaveStatus({
  state,
  onResolveConflict,
  labels,
}: {
  state: DraftSaveState;
  onResolveConflict?: () => void;
  labels?: Partial<Record<DraftSaveState, string>> & { conflictAction?: string };
}) {
  const Icon = state === "saving" ? Loader2 : state === "error" || state === "conflict" ? CloudAlert : Cloud;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center gap-2 self-start rounded-full px-3 text-xs font-bold",
        state === "saved" && "bg-emerald-50 text-emerald-800",
        (state === "error" || state === "conflict") && "bg-danger-bg text-danger-text",
        (state === "idle" || state === "saving") && "bg-slate-100 text-slate-600",
      )}
    >
      <Icon className={cn("h-4 w-4", state === "saving" && "animate-spin")} />
      <span>{labels?.[state] ?? saveStateCopy[state]}</span>
      {state === "conflict" && onResolveConflict ? (
        <button
          type="button"
          onClick={onResolveConflict}
          className="ml-1 rounded-full border border-danger-border bg-white px-2 py-1 text-[11px] font-black text-danger-text outline-none hover:bg-danger-bg focus-visible:ring-2 focus-visible:ring-danger-text"
        >
          {labels?.conflictAction ?? "Keep this tab"}
        </button>
      ) : null}
    </div>
  );
}
