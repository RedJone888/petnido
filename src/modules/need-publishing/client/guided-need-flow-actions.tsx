"use client";

import { PiFloppyDisk } from "react-icons/pi";

import { DraftSaveStatus } from "@/components/publishing/publishing-flow-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/i18n/use-need-publishing-messages";
import cn from "@/lib/cn";

type SaveState = "idle" | "saving" | "saved" | "conflict" | "error";

export function GuidedNeedFlowActions({
  onSaveExit,
  saveState,
  onResolveConflict,
  className,
  compact = false,
  stacked = false,
  showStatus = true,
  showSave = true,
}: {
  onSaveExit: () => void | Promise<void>;
  saveState?: SaveState;
  onResolveConflict?: () => void;
  className?: string;
  compact?: boolean;
  stacked?: boolean;
  showStatus?: boolean;
  showSave?: boolean;
}) {
  const { t } = useLanguage();
  const needCopy = useNeedPublishingMessages().needPublishing;
  const serviceCopy = t.core.servicePublishing;

  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2",
        stacked &&
          "flex-col items-start [&>[role=status]]:w-full [&>[role=status]]:whitespace-normal",
        className,
      )}
    >
      {showStatus && saveState ? (
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
      ) : null}
      {showSave ? (
        <button
          type="button"
          onClick={onSaveExit}
          aria-label={needCopy.saveExit}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl text-sm font-bold text-[#625a67] transition hover:bg-[#f2edf4] hover:text-[var(--primary)]",
            compact
              ? "px-2 sm:px-3"
              : stacked
                ? "w-full justify-start px-3"
                : "justify-center px-3",
          )}
        >
          <PiFloppyDisk size={18} />
          <span>{needCopy.saveExit}</span>
        </button>
      ) : null}
    </div>
  );
}
