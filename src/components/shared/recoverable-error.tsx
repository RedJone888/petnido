"use client";

import Link from "next/link";

import { recoveryAdvice } from "@/domain/errors/recovery";
import { useLanguage } from "@/components/providers/language-provider";

export function RecoverableError({ error, onRetry, onRefresh, onDiscardDraft, backHref = "/dashboard", compact = false }: { error: unknown; onRetry?: () => void; onRefresh?: () => void; onDiscardDraft?: () => void; backHref?: string; compact?: boolean }) {
  const { t } = useLanguage();
  const advice = recoveryAdvice(error);
  const localized = t.recovery[advice.kind];
  const action = advice.action === "LOGIN" ? <Link href={`/auth/sign-in?returnTo=${encodeURIComponent(backHref)}`} className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-white">{t.recovery.actions.LOGIN}</Link>
    : advice.action === "BACK" ? <Link href={backHref} className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-white">{t.recovery.actions.BACK}</Link>
      : advice.action === "REFRESH" ? <button type="button" onClick={onRefresh ?? (() => window.location.reload())} className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-white">{t.recovery.actions.REFRESH}</button>
        : advice.action === "DISCARD_DRAFT" && onDiscardDraft ? <button type="button" onClick={onDiscardDraft} className="rounded-xl border border-danger-border px-4 py-2 text-sm font-black text-danger-text">{t.recovery.actions.DISCARD_DRAFT}</button>
          : advice.action === "RETRY" && onRetry ? <button type="button" onClick={onRetry} className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-white">{t.recovery.actions.RETRY}</button> : null;
  return <section role="alert" aria-live="assertive" className={`rounded-2xl border border-danger-border bg-danger-bg ${compact ? "p-4" : "p-6 text-center"}`}><h2 className="font-black text-danger-text">{localized.title}</h2><p className="mt-2 text-sm leading-6 text-danger-text">{localized.description}</p>{action ? <div className="mt-4">{action}</div> : null}{advice.correlationId ? <p className="mt-3 text-[11px] text-danger-text">{t.recovery.correlation}: {advice.correlationId}</p> : null}</section>;
}
