"use client";

import Link from "next/link";
import {
  PiBookmarkSimple,
  PiCheckCircle,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";

import { RecommendationPanel } from "@/components/matching/recommendation-panel";
import type { Lang } from "@/domain/lang/types";
import type { NeedDraftSnapshotV3 } from "@/domain/publishing/legacy-need-draft-v3";
import { messages } from "@/i18n/messages";

type NeedPublishingCopy = typeof messages.en.core.needPublishing;

function formatDraftAge(savedAt: number, lang: Lang) {
  const minutes = Math.max(1, Math.round((Date.now() - savedAt) / 60_000));
  const relative = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (minutes < 60) return relative.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");
  return relative.format(-Math.round(hours / 24), "day");
}

export function DraftRecoveryDialogs({
  damagedDraftDetected,
  pendingDraft,
  lang,
  copy,
  damagedTitle,
  damagedDescription,
  discardDamagedLabel,
  onDiscardDamaged,
  onDiscardDraft,
  onResumeDraft,
}: {
  damagedDraftDetected: boolean;
  pendingDraft: NeedDraftSnapshotV3 | null;
  lang: Lang;
  copy: NeedPublishingCopy;
  damagedTitle?: string;
  damagedDescription?: string;
  discardDamagedLabel?: string;
  onDiscardDamaged: () => void;
  onDiscardDraft: () => void;
  onResumeDraft: () => void;
}) {
  return (
    <>
      {damagedDraftDetected && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-[#211d27]/35 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="damaged-need-draft-title"
        >
          <div className="w-full max-w-[460px] rounded-[22px] border border-danger-border bg-white p-6 shadow-2xl md:p-7">
            <PiWarningCircle className="text-danger-text" size={28} />
            <h2 id="damaged-need-draft-title" className="mt-4 text-2xl font-bold">
              {damagedTitle ?? "This draft cannot be restored safely"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#706a78]">
              {damagedDescription ??
                "The local draft is damaged or uses an unsupported version. It has not been sent to the server and will not overwrite any valid server draft."}
            </p>
            <button
              type="button"
              onClick={onDiscardDamaged}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-danger-border px-5 text-sm font-bold text-danger-text"
            >
              {discardDamagedLabel ??
                "Discard damaged local draft and start over"}
            </button>
          </div>
        </div>
      )}

      {pendingDraft && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#211d27]/35 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-draft-title"
        >
          <div className="w-full max-w-[460px] rounded-[22px] border border-[#ded9e0] bg-white p-6 shadow-[0_28px_80px_-32px_rgba(33,29,39,0.6)] md:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-fixed)] text-[var(--primary)]">
              <PiBookmarkSimple size={22} />
            </span>
            <h2 id="restore-draft-title" className="mt-5 text-2xl font-bold tracking-[-0.025em]">
              {copy.continueDraftTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#706a78]">
              {copy.continueDraftDetail
                .replace(
                  "{careType}",
                  pendingDraft.careType
                    ? copy.careTypes[pendingDraft.careType].title
                    : copy.postNeed,
                )
                .replace("{age}", formatDraftAge(pendingDraft.savedAt, lang))}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onDiscardDraft}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#cfc7d2] px-5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary-subtle)]"
              >
                {copy.startOver}
              </button>
              <button
                type="button"
                onClick={onResumeDraft}
                className="button-primary-raised inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
              >
                {copy.resumeRequest}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type PublishOutcome = {
  needId: string;
  shouldPromptForEmail: boolean;
  edited: boolean;
};

export function PublishFeedback({
  showDraftNotice,
  publishOutcome,
  publishError,
  copy,
  onCloseDraftNotice,
}: {
  showDraftNotice: boolean;
  publishOutcome: PublishOutcome | null;
  publishError: string | null;
  copy: NeedPublishingCopy;
  onCloseDraftNotice: () => void;
}) {
  return (
    <>
      {showDraftNotice && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-[#d8c9e3] bg-white p-4 shadow-2xl">
          <div className="flex gap-3">
            <PiCheckCircle className="mt-0.5 shrink-0 text-[var(--primary)]" size={21} />
            <div className="flex-1">
              <p className="text-sm font-bold">{copy.draftReady}</p>
              <p className="mt-1 text-xs leading-5 text-[#706a78]">
                {copy.draftReadyDetail}
              </p>
            </div>
            <button type="button" aria-label={copy.closeNotice} onClick={onCloseDraftNotice}>
              <PiX size={17} />
            </button>
          </div>
        </div>
      )}

      {publishOutcome && (
        <div
          className="fixed bottom-24 left-1/2 z-50 w-[min(460px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"
          role="status"
        >
          <div className="flex gap-3">
            <PiCheckCircle className="mt-0.5 shrink-0 text-emerald-700" size={21} />
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-900">
                {publishOutcome.edited ? copy.requestUpdated : copy.requestPublished}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#706a78]">
                {copy.serverConfirmed}
              </p>
              <div className="mt-3">
                <RecommendationPanel kind="NEED" id={publishOutcome.needId} compact />
              </div>
              {publishOutcome.shouldPromptForEmail ? (
                <Link
                  href="/dashboard/settings#preferences"
                  className="mt-3 inline-flex text-xs font-bold text-[var(--primary)] underline"
                >
                  {copy.emailNotifications}
                </Link>
              ) : null}
              <p className="mt-2 break-all text-[11px] text-slate-400">
                {copy.requestId} {publishOutcome.needId}
              </p>
              <Link
                href={`/dashboard/matches?needId=${encodeURIComponent(publishOutcome.needId)}`}
                className="mt-3 inline-flex text-xs font-bold text-[var(--primary)] underline"
              >
                {copy.openMatching}
              </Link>
            </div>
          </div>
        </div>
      )}

      {publishError && (
        <div
          role="alert"
          className="fixed bottom-24 left-1/2 z-50 w-[min(460px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-danger-border bg-danger-bg p-4 text-sm font-bold text-danger-text shadow-2xl"
        >
          {publishError}
        </div>
      )}
    </>
  );
}
