"use client";

import Image from "next/image";
import Link from "next/link";
import { PiBookmarkSimple } from "react-icons/pi";

import { DraftSaveStatus } from "@/components/publishing/publishing-flow-shell";
import { useLanguage } from "@/components/providers/language-provider";

export function GuidedNeedFlowHeader({
  onSaveExit,
  saveState,
  onResolveConflict,
}: {
  onSaveExit: () => void | Promise<void>;
  saveState?: "idle" | "saving" | "saved" | "conflict" | "error";
  onResolveConflict?: () => void;
}) {
  const { t } = useLanguage();
  const needCopy = t.core.needPublishing;
  const serviceCopy = t.core.servicePublishing;

  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e0e8] bg-[#fffdf9]/95 backdrop-blur-lg">
      <div className="site-shell flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="PetNido"
        >
          <Image
            src="/favicon.svg"
            alt=""
            width={38}
            height={38}
            className="h-9 w-9"
          />
          <span className="text-2xl font-bold tracking-[0.015em] text-[var(--primary)] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed] md:text-[1.7rem]">
            PetNido
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {saveState ? (
            <div className="hidden md:block">
              <DraftSaveStatus
                state={saveState}
                onResolveConflict={onResolveConflict}
                labels={{
                  idle: serviceCopy.saveIdle,
                  saving: serviceCopy.saveSaving,
                  saved: serviceCopy.saveSaved,
                  conflict: serviceCopy.saveConflict,
                  error: serviceCopy.saveError,
                  conflictAction: serviceCopy.keepTab,
                }}
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={onSaveExit}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-xs font-bold text-[#625a67] transition hover:bg-[#f2edf4] hover:text-[var(--primary)] md:px-3 md:text-sm"
          >
            <PiBookmarkSimple size={18} /> {needCopy.saveExit}
          </button>
        </div>
      </div>
      {saveState ? (
        <div className="site-shell flex justify-end pb-2 md:hidden">
          <DraftSaveStatus
            state={saveState}
            onResolveConflict={onResolveConflict}
            labels={{
              idle: serviceCopy.saveIdle,
              saving: serviceCopy.saveSaving,
              saved: serviceCopy.saveSaved,
              conflict: serviceCopy.saveConflict,
              error: serviceCopy.saveError,
              conflictAction: serviceCopy.keepTab,
            }}
          />
        </div>
      ) : null}
    </header>
  );
}
