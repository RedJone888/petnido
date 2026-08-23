"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  PiArrowLeft,
  PiArrowRight,
  PiCaretDown,
  PiCheckCircle,
  PiPaperPlaneTilt,
  PiSpinnerGap,
} from "react-icons/pi";

import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import {
  PublishingStepNavigation,
  type PublishingStep,
} from "@/components/publishing/publishing-flow-shell";
import type { ScreenId } from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import { GuidedNeedFlowActions } from "./guided-need-flow-actions";

type SaveState = "idle" | "saving" | "saved" | "conflict" | "error";

const stepIllustrations: Record<ScreenId, { position: string; alt: string }> = {
  care: { position: "0% 0%", alt: "A pet owner choosing between care options" },
  pets: {
    position: "33.333% 0%",
    alt: "A dog, cat, rabbit, and bird ready to be introduced",
  },
  dates: { position: "66.667% 0%", alt: "A calendar beside resting pets" },
  frequency: {
    position: "100% 0%",
    alt: "A sitter arriving for a scheduled home visit",
  },
  tasks: {
    position: "0% 50%",
    alt: "Pets beside food, water, and play supplies",
  },
  supplies: {
    position: "0% 50%",
    alt: "Food, carriers, bowls, and other supplies prepared for a pet stay",
  },
  requirements: {
    position: "33.333% 50%",
    alt: "A calm pet-friendly living room",
  },
  cautions: {
    position: "66.667% 50%",
    alt: "A sitter reviewing a pet safety checklist",
  },
  transport: { position: "100% 50%", alt: "A pet carrier beside a car" },
  area: {
    position: "0% 100%",
    alt: "A neighborhood map with a pet-care location pin",
  },
  budget: {
    position: "33.333% 100%",
    alt: "A wallet and coins beside a pet bowl",
  },
  preview: {
    position: "66.667% 100%",
    alt: "A completed care request beside happy pets",
  },
};

export function GuidedNeedFlowLayout({
  children,
  current,
  currentId,
  currentIndex,
  steps,
  careTypeSelected,
  canPublish,
  publishing,
  syncing = false,
  syncingLabel = "Syncing draft…",
  publishComplete,
  saveState,
  onSaveExit,
  onResolveConflict,
  onStepSelect,
  onBack,
  onNext,
  onPublish,
}: {
  children: ReactNode;
  current: { title: string; description: string };
  currentId: ScreenId;
  currentIndex: number;
  steps: PublishingStep[];
  careTypeSelected: boolean;
  canPublish: boolean;
  publishing: boolean;
  syncing?: boolean;
  syncingLabel?: string;
  publishComplete: boolean;
  saveState?: SaveState;
  onSaveExit: () => void | Promise<void>;
  onResolveConflict?: () => void;
  onStepSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void | Promise<void>;
}) {
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  const mobileStepsRef = useRef<HTMLDivElement | null>(null);
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing;
  const illustration = stepIllustrations[currentId] ?? {
    position: "0% 0%",
    alt: "",
  };
  useEffect(() => {
    if (!mobileStepsOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!mobileStepsRef.current?.contains(event.target as Node)) {
        setMobileStepsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileStepsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileStepsOpen]);

  useEffect(() => setMobileStepsOpen(false), [currentId]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden lg:block lg:h-auto lg:overflow-visible">
      <div className="shrink-0 border-b border-[#e7e0e8] bg-[#fcfbf8] lg:hidden">
        <div className="site-shell py-3.5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
            {copy.postNeed}
          </p>
          <div className="mt-1.5 flex min-h-9 items-center justify-between gap-2">
            <span className="shrink-0 text-sm font-bold text-[var(--primary)]">
              {copy.stepProgress
                .replace("{current}", String(currentIndex + 1))
                .replace("{total}", String(steps.length))}
            </span>
            <GuidedNeedFlowActions
              onSaveExit={onSaveExit}
              saveState={saveState}
              onResolveConflict={onResolveConflict}
              compact
              showStatus={false}
            />
          </div>
          <div ref={mobileStepsRef} className="relative mt-0.5 flex min-h-9 items-center justify-between gap-2">
            <button
              type="button"
              aria-expanded={mobileStepsOpen}
              aria-controls="mobile-publishing-steps"
              onClick={() => setMobileStepsOpen((open) => !open)}
              className="flex min-w-0 items-center gap-2 rounded-xl py-2 pr-2 text-left outline-none transition hover:text-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-bold text-white">
                  {currentIndex + 1}
                </span>
                <span className="truncate text-sm font-bold text-[var(--primary)]">
                  {steps[currentIndex]?.label}
                </span>
              </span>
              <PiCaretDown
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 shrink-0 text-[#807786] transition-transform",
                  mobileStepsOpen && "rotate-180",
                )}
              />
            </button>
            <GuidedNeedFlowActions
              onSaveExit={onSaveExit}
              saveState={saveState}
              onResolveConflict={onResolveConflict}
              showSave={false}
            />
            {mobileStepsOpen ? (
            <div
              id="mobile-publishing-steps"
              className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[min(65dvh,520px)] overflow-y-auto rounded-2xl border border-[#e1d8e6] bg-[#fcfbf8] p-3 shadow-[0_18px_45px_-20px_rgba(48,32,60,0.55)]"
            >
              <PublishingStepNavigation
                steps={steps}
                onStepSelect={(id) => {
                  onStepSelect(id);
                  setMobileStepsOpen(false);
                }}
                orientation="vertical"
              />
            </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="site-shell flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:overflow-visible lg:pb-9 lg:pt-7 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-9 xl:gap-11">
        <aside className="hidden min-w-0 lg:sticky lg:top-[84px] lg:flex lg:h-[calc(100dvh-84px)] lg:flex-col lg:self-start lg:pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
            {copy.postNeed}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <PublishingStepNavigation
              steps={steps}
              onStepSelect={onStepSelect}
              className="mt-3"
            />
          </div>
          <GuidedNeedFlowActions
            onSaveExit={onSaveExit}
            saveState={saveState}
            onResolveConflict={onResolveConflict}
            className="mt-3 shrink-0 border-t border-[#e7e0e8] pt-3"
            stacked
          />
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:block">
          <div className="relative isolate mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col lg:block">
            <div
              data-need-flow-scroll-region
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-5 lg:overflow-visible lg:pt-0"
            >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 -z-10 hidden h-[185px] w-[185px] bg-[url('/images/need-flow-step-sprite-v1.png')] bg-[length:400%_300%] bg-no-repeat mix-blend-multiply md:block lg:h-[195px] lg:w-[195px]"
              style={{
                backgroundPosition: illustration.position,
                WebkitMaskImage:
                  "radial-gradient(ellipse 82% 82% at center, #000 58%, transparent 100%)",
                maskImage:
                  "radial-gradient(ellipse 82% 82% at center, #000 58%, transparent 100%)",
              }}
            />

            <section className="border-b border-[#e3dde5] pb-5 md:max-w-[calc(100%_-_215px)] lg:max-w-[calc(100%_-_225px)]">
              <h1 className="text-3xl font-bold leading-[1.12] tracking-[-0.035em] md:text-[34px] lg:text-[36px] xl:text-[38px]">
                {current.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#706a78]">
                {current.description}
              </p>
            </section>

            <section className="w-full py-5 md:py-7">{children}</section>
            </div>

            <footer className="flex w-full shrink-0 items-center justify-start gap-4 border-t border-[#e3dde5] bg-[#fcfbf8] py-3 md:py-4 lg:py-6">
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-12 items-center gap-2 rounded-[12px] border border-[var(--primary)] px-5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary-subtle)]"
                >
                  <PiArrowLeft size={18} /> {copy.back}
                </button>
              )}
              {currentId === "preview" ? (
                <button
                  type="button"
                  disabled={!canPublish || publishing || publishComplete}
                  onClick={onPublish}
                  className={cn(
                    "button-primary-raised inline-flex h-12 items-center gap-2 rounded-[12px] px-5 text-sm font-bold",
                  )}
                >
                  {publishComplete
                    ? copy.published
                    : publishing
                      ? syncing
                        ? syncingLabel
                        : copy.publishing
                      : copy.publishRequest}{" "}
                  {publishComplete ? (
                    <PiCheckCircle size={18} />
                  ) : publishing ? (
                    <PiSpinnerGap className="animate-spin" size={18} />
                  ) : (
                    <PiPaperPlaneTilt size={18} />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentId === "care" && !careTypeSelected}
                  className={cn(
                    "button-primary-raised inline-flex h-12 items-center gap-2 rounded-[12px] px-6 text-sm font-bold",
                  )}
                >
                  {copy.next} <PiArrowRight size={18} />
                </button>
              )}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
