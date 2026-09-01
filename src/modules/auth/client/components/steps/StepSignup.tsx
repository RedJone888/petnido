"use client";
import type { StepType } from "@/modules/auth/schemas";
import { FloatInput } from "@/components/shared/float-input";
import { LoadingButton } from "@/components/shared/loading-button";
import { stepSignupLinkSchema } from "@/modules/auth/schemas";
import { useState } from "react";
import { TRPCClientError } from "@trpc/client";
import { useAuthMessages } from "../../../i18n/use-auth-messages";
type Props = {
  email: string;
  username: string;
  setUserName: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  setStep: (step: StepType) => void;
  handleSendCode: () => Promise<void>;
  loading: boolean;
};
export default function StepSignup({
  email,
  username,
  setUserName,
  password,
  setPassword,
  setStep,
  loading,
  handleSendCode,
}: Props) {
  const copy = useAuthMessages().modal;
  const [apiError, setApiError] = useState("");
  const [usernameFormatError, setUsernameFormatError] = useState("");
  const [passwordFormatError, setPasswordFormatError] = useState("");
  const handleChangeUsername = (username: string) => {
    if (usernameFormatError) setUsernameFormatError("");
    if (apiError) setApiError("");
    setUserName(username);
  };
  const handleChangePassword = (password: string) => {
    if (passwordFormatError) setPasswordFormatError("");
    if (apiError) setApiError("");
    setPassword(password);
  };
  const handleCancel = () => {
    setUserName("");
    setPassword("");
    setStep("email");
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    const validate = stepSignupLinkSchema.safeParse({
      email,
      password,
      username,
    });
    if (!validate.success) {
      const fieldErrors = validate.error.formErrors.fieldErrors;
      setUsernameFormatError(fieldErrors.username?.[0] || "");
      setPasswordFormatError(fieldErrors.password?.[0] || "");
      return;
    }
    try {
      await handleSendCode();
      setStep("verify");
    } catch (error) {
      if (error instanceof TRPCClientError) {
        const msg =
          error.message === "EMAIL_SEND_FAILED"
            ? copy.emailSendFailed
            : copy.serverError;
        setApiError(msg);
      }
    }
  };
  return (
    <form className="space-y-6" onSubmit={handleSignup}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        {copy.signupTitle}
      </h3>
      <FloatInput label={copy.email} value={email} editable={false} />
      <FloatInput
        label={copy.username}
        value={username}
        onChange={handleChangeUsername}
        error={usernameFormatError}
      />
      <FloatInput
        type="password"
        label={copy.signupPassword}
        value={password}
        onChange={handleChangePassword}
        error={passwordFormatError}
      />

      {apiError && (
        <p className="text-danger-text text-sm text-center">{apiError}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton variant="ghost" onClick={handleCancel}>
          {copy.cancel}
        </LoadingButton>
        <LoadingButton type="submit" loading={loading} loadingText={copy.registering}>
          {copy.signup}
        </LoadingButton>
      </div>
    </form>
  );
}
