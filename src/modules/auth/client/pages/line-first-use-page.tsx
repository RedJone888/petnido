"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LoadingButton } from "@/components/shared/loading-button";
import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { trpc } from "@/utils/trpc";
import { authEmailSchema } from "@/modules/auth/schemas";

import { authContinuationUrl } from "../../return-to";
import { useAuthMessages } from "../../i18n/use-auth-messages";
import { AuthPageCard } from "../components/auth-page-card";

export function LineFirstUsePageClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const copy = useAuthMessages().lineFirstUse;
  const lineLinkErrorMessage = (code: string) =>
    copy.errors[code as keyof typeof copy.errors] ?? copy.errors.DEFAULT;
  const [binding, setBinding] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const emailValid = authEmailSchema.safeParse(email).success;
  const createNew = trpc.auth.completeLineAsNewAccount.useMutation({
    onSuccess: () => router.replace(authContinuationUrl(returnTo)),
    onError: (value) => setError(lineLinkErrorMessage(value.message)),
  });
  const request = trpc.auth.requestLineLink.useMutation({
    onSuccess: () => setSent(true),
    onError: (value) => setError(lineLinkErrorMessage(value.message)),
  });
  const confirm = trpc.auth.confirmLineLink.useMutation({
    async onSuccess(result) {
      const signedIn = await signIn("credentials", { ticket: result.ticket, redirect: false });
      if (signedIn?.error) return setError(lineLinkErrorMessage("SESSION_CREATE_FAILED"));
      router.replace(authContinuationUrl(returnTo));
      router.refresh();
    },
    onError: (value) => setError(lineLinkErrorMessage(value.message)),
  });

  return (
    <AuthPageCard title={copy.title}>
        {!binding ? (
          <div className="grid gap-3">
            <LoadingButton onClick={() => setBinding(true)}>{copy.connectExisting}</LoadingButton>
            <LoadingButton
              variant="ghost"
              loading={createNew.isLoading}
              loadingText={copy.creating}
              onClick={() => createNew.mutate()}
            >
              {copy.createNew}
            </LoadingButton>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">{copy.existingEmail}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setSent(false); setCode(""); }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>
            {!sent ? (
              <LoadingButton
                loading={request.isLoading}
                loadingText={copy.sending}
                onClick={() => {
                  setError("");
                  if (!emailValid) {
                    setError(copy.errors.INVALID_EMAIL);
                    return;
                  }
                  request.mutate({ email });
                }}
                disabled={!email.trim()}
              >
                {copy.sendCode}
              </LoadingButton>
            ) : (
              <>
                <VerificationCodeInput value={code} onChange={setCode} digitLabel={copy.code} />
                <LoadingButton
                  loading={confirm.isLoading}
                  loadingText={copy.confirming}
                  disabled={code.length !== 6}
                  onClick={() => {
                    setError("");
                    confirm.mutate({ email, code });
                  }}
                >
                  {copy.confirm}
                </LoadingButton>
              </>
            )}
            <button className="text-sm text-slate-500 underline" onClick={() => setBinding(false)}>{copy.back}</button>
          </div>
        )}
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
    </AuthPageCard>
  );
}
