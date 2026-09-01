"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

export function PendingConsultationAction({
  kind,
  publicId,
  returnTo,
  clientMessageId,
}: {
  kind: "NEED" | "SERVICE";
  publicId: string;
  returnTo: string;
  clientMessageId: string;
}) {
  const { t } = useLanguage();
  const copy = t.core.pendingAction;
  const router = useRouter();
  const [body, setBody] = useState("");
  const consultation = trpc.conversation.startConsultation.useMutation({
    onSuccess: (result) => {
      router.replace(`/dashboard/messages?conversation=${encodeURIComponent(result.conversationId)}`);
    },
  });
  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    consultation.mutate({ target: { kind, publicId }, body: trimmed, clientMessageId });
  };

  return (
    <>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        {copy.consultationPrompt}
      </p>
      <label className="mt-5 block text-sm font-bold text-slate-800">
        {copy.firstMessage}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, 4000))}
          rows={5}
          placeholder={copy.consultationPlaceholder}
          className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm font-normal leading-6 outline-none focus:border-primary"
        />
      </label>
      <p className="mt-1 text-right text-xs text-slate-400">{body.length}/4000</p>
      {consultation.error ? <p className="mt-4 rounded-xl bg-danger-bg p-3 text-sm text-danger-text" role="alert">{copy.consultationError}</p> : null}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={returnTo} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">{copy.back}</Link>
        <button type="button" disabled={!body.trim() || consultation.isLoading} onClick={submit} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {consultation.isLoading ? copy.startingConsultation : copy.startConsultation}
        </button>
      </div>
    </>
  );
}
