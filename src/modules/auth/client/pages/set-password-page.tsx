"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { Button } from "@/components/ui/button";
import { authPasswordSchema } from "@/modules/auth/schemas";
import { trpc } from "@/utils/trpc";

import { useAuthMessages } from "../../i18n/use-auth-messages";
import { AuthPageCard } from "../components/auth-page-card";
import { PasswordField } from "../components/password-field";

type PasswordSetupStage = "request" | "verify" | "password";

export function SetPasswordPageClient({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}) {
  const messages = useAuthMessages();
  const router = useRouter();
  const utils = trpc.useUtils();
  const copy = messages.setPasswordPage;
  const passwordCopy = messages.passwordField;
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<PasswordSetupStage>("request");
  const [error, setError] = useState("");
  const passwordValid = authPasswordSchema.safeParse(password).success;
  const passwordError = password.length > 0 && !passwordValid ? passwordCopy.invalid : "";

  const errorMessage = (value: string) => {
    switch (value) {
      case "INVALID_CODE":
        return copy.invalidCode;
      case "CODE_EXPIRED":
        return copy.codeExpired;
      case "TOO_MANY_CODE_ATTEMPTS":
        return copy.attemptsExceeded;
      case "RATE_LIMITED":
        return copy.rateLimited;
      default:
        return copy.genericError;
    }
  };

  const request = trpc.auth.requestPasswordSetup.useMutation({
    onSuccess: () => {
      setStage("verify");
      setError("");
    },
    onError: (value) => setError(errorMessage(value.message)),
  });
  const verify = trpc.auth.verifyPasswordSetupCode.useMutation({
    onSuccess: () => {
      setStage("password");
      setError("");
    },
    onError: (value) => setError(errorMessage(value.message)),
  });
  const confirm = trpc.auth.confirmPasswordSetup.useMutation({
    onSuccess: () => {
      setError("");
      void utils.auth.getAccountOverview.invalidate();
      toast.success(copy.completed);
      router.replace("/dashboard/settings");
    },
    onError: (value) => setError(errorMessage(value.message)),
  });

  return (
    <AuthPageCard title={hasPassword ? copy.changeTitle : copy.setTitle}>
      <>
          <p className="text-sm leading-6 text-slate-600">{copy.description}</p>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">{copy.email}</span>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700"
            />
          </label>

          {stage === "verify" ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-slate-700">{copy.code}</legend>
              <VerificationCodeInput value={code} onChange={(value) => { setCode(value); setError(""); }} className="my-3 justify-start" digitLabel={copy.code} />
            </fieldset>
          ) : null}

          {stage === "password" ? (
            <PasswordField
              label={passwordCopy.label}
              value={password}
              onChange={(value) => { setPassword(value); setError(""); }}
              hint={passwordCopy.hint}
              error={passwordError}
              showLabel={passwordCopy.show}
              hideLabel={passwordCopy.hide}
            />
          ) : null}

          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button href="/dashboard/settings" variant="outline" className="min-h-11 w-full">
              {copy.cancel}
            </Button>
            {stage === "request" ? (
              <LoadingButton
                loading={request.isLoading}
                loadingText={copy.sending}
                className="min-h-11 w-full"
                onClick={() => request.mutate({})}
              >
                {copy.sendCode}
              </LoadingButton>
            ) : stage === "verify" ? (
              <LoadingButton
                loading={verify.isLoading}
                loadingText={copy.verifying}
                disabled={code.length !== 6}
                className="min-h-11 w-full"
                onClick={() => verify.mutate({ code })}
              >
                {copy.verifyCode}
              </LoadingButton>
            ) : (
              <LoadingButton
                loading={confirm.isLoading}
                loadingText={copy.changing}
                disabled={!passwordValid}
                className="min-h-11 w-full"
                onClick={() => confirm.mutate({ code, password })}
              >
                {hasPassword ? copy.changeConfirm : copy.confirm}
              </LoadingButton>
            )}
          </div>
      </>
    </AuthPageCard>
  );
}
