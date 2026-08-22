"use client";

import type { ReactNode } from "react";
import { PiArrowLeft, PiArrowRight, PiCheck } from "react-icons/pi";

import { useLanguage } from "@/components/providers/language-provider";
import {
  PublishingStepNavigation,
  type PublishingStep,
} from "@/components/publishing/publishing-flow-shell";
import type { ScreenId } from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import { GuidedNeedFlowHeader } from "./guided-need-flow-header";

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
  publishComplete: boolean;
  saveState?: SaveState;
  onSaveExit: () => void | Promise<void>;
  onResolveConflict?: () => void;
  onStepSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const copy = t.core.needPublishing;
  const illustration = stepIllustrations[currentId] ?? {
    position: "0% 0%",
    alt: "",
  };

  return (
    <>
      <GuidedNeedFlowHeader
        onSaveExit={onSaveExit}
        saveState={saveState}
        onResolveConflict={onResolveConflict}
      />

      <div className="site-shell grid gap-7 pb-7 pt-4 md:pb-9 md:pt-6 lg:grid-cols-[152px_minmax(0,1fr)] lg:gap-9 xl:gap-11">
        <aside className="min-w-0 lg:sticky lg:top-[88px] lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
            {copy.postNeed}
          </p>
          <PublishingStepNavigation
            steps={steps}
            onStepSelect={onStepSelect}
            className="mt-3"
          />
        </aside>

        <main className="min-w-0">
          <div className="relative isolate mx-auto w-full max-w-[1120px]">
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

            <footer className="flex w-full items-center justify-start gap-4 border-t border-[#e3dde5] py-4 md:py-6">
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
                  {publishing
                    ? copy.publishing
                    : publishComplete
                      ? copy.published
                      : copy.publishRequest}{" "}
                  <PiCheck size={18} />
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
    </>
  );
}
