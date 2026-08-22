"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/loading-button";
import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { Button } from "@/components/ui/button";
import { authEmailSchema, authPasswordSchema } from "@/modules/auth/schemas";
import { authSignInUrl, sanitizeReturnTo } from "@/modules/auth/return-to";
import { trpc } from "@/utils/trpc";

import { useAuthMessages } from "../../i18n/use-auth-messages";
import { AuthPageCard } from "../components/auth-page-card";
import { PasswordField } from "../components/password-field";

type PasswordResetStage = "request" | "verify" | "password";

export function ForgotPasswordPageClient({
  initialEmail,
  returnTo,
  cancelTo,
}: {
  initialEmail: string;
  returnTo: string;
  cancelTo: string;
}) {
  const messages = useAuthMessages();
  const router = useRouter();
  const copy = messages.forgotPassword;
  const safeReturnTo = sanitizeReturnTo(returnTo, "/");
  const safeCancelTo = sanitizeReturnTo(cancelTo, "/");
  const passwordCopy = messages.passwordField;
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<PasswordResetStage>("request");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const emailValid = authEmailSchema.safeParse(email).success;
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

  const request = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setStage("verify");
      setError("");
    },
    onError: (value) => setError(errorMessage(value.message)),
  });
  const verify = trpc.auth.verifyPasswordResetCode.useMutation({
    onSuccess: () => {
      setStage("password");
      setError("");
    },
    onError: (value) => setError(errorMessage(value.message)),
  });
  const confirm = trpc.auth.confirmPasswordReset.useMutation({
    onSuccess: () => {
      setError("");
      toast.success(copy.completed);
      router.replace(authSignInUrl(safeReturnTo));
    },
    onError: (value) => setError(errorMessage(value.message)),
  });

  const sendCode = () => {
    if (!emailValid) {
      setEmailError(copy.emailInvalid);
      return;
    }
    setEmailError("");
    setError("");
    request.mutate({ email });
  };

  return (
    <AuthPageCard title={copy.title}>
      <>
          <p className="text-sm leading-6 text-slate-600">{copy.description}</p>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">{copy.email}</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              readOnly={stage !== "request"}
              aria-invalid={Boolean(emailError)}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
                setError("");
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition read-only:bg-slate-50 focus:ring-2 focus:ring-primary/30"
            />
          </label>
          {emailError ? <p role="alert" className="text-sm text-red-600">{emailError}</p> : null}

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
            <Button href={safeCancelTo} variant="outline" className="min-h-11 w-full">
              {copy.cancel}
            </Button>
            {stage === "request" ? (
              <LoadingButton
                loading={request.isLoading}
                loadingText={copy.sending}
                disabled={!email.trim()}
                className="min-h-11 w-full"
                onClick={sendCode}
              >
                {copy.sendCode}
              </LoadingButton>
            ) : stage === "verify" ? (
              <LoadingButton
                loading={verify.isLoading}
                loadingText={copy.verifying}
                disabled={code.length !== 6}
                className="min-h-11 w-full"
                onClick={() => verify.mutate({ email, code })}
              >
                {copy.verifyCode}
              </LoadingButton>
            ) : (
              <LoadingButton
                loading={confirm.isLoading}
                loadingText={copy.saving}
                disabled={!passwordValid}
                className="min-h-11 w-full"
                onClick={() => confirm.mutate({ email, code, password })}
              >
                {copy.setPassword}
              </LoadingButton>
            )}
          </div>
      </>
    </AuthPageCard>
  );
}
