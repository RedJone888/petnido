"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

export function PendingApplicationAction({
  publicId,
  returnTo,
  idempotencyKey,
}: {
  publicId: string;
  returnTo: string;
  idempotencyKey: string;
}) {
  const { t } = useLanguage();
  const copy = t.core.pendingAction;
  const router = useRouter();
  const [body, setBody] = useState("");
  const provider = trpc.serviceProfile.getSettings.useQuery();
  const application = trpc.needApplication.create.useMutation({
    onSuccess: (result) => router.replace(`/dashboard/messages?conversation=${encodeURIComponent(result.conversationId)}`),
  });

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    application.mutate({ target: { kind: "NEED", publicId }, body: trimmed, idempotencyKey });
  };

  return (
    <>
      <p className="mt-4 text-sm leading-6 text-slate-600">{copy.applicationStatus}</p>
      {!provider.isLoading && provider.data?.serviceProfile ? (
        <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm leading-6 text-purple-900">{copy.providerProfile}<Link href="/dashboard/serviceprofile" className="ml-1 font-bold underline">{copy.viewProfile}</Link></div>
      ) : !provider.isLoading ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{copy.noProviderProfile}</div>
      ) : null}
      <label className="mt-5 block text-sm font-bold text-slate-800">{copy.applicationMessage}<textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 4000))} rows={6} placeholder={copy.applicationPlaceholder} className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm font-normal leading-6 outline-none focus:border-primary" /></label>
      <p className="mt-1 text-right text-xs text-slate-400">{body.length}/4000</p>
      {application.error ? <p className="mt-4 rounded-xl bg-danger-bg p-3 text-sm text-danger-text" role="alert">{copy.applicationError}</p> : null}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={returnTo} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">{copy.back}</Link><button type="button" disabled={!body.trim() || application.isLoading} onClick={submit} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{application.isLoading ? copy.applying : copy.apply}</button></div>
    </>
  );
}
