"use client";
import type { StepType } from "@/modules/auth/schemas";
import { FloatInput } from "@/components/shared/float-input";
import { LoadingButton } from "@/components/shared/loading-button";
import { stepEmailSchema } from "@/modules/auth/schemas";
import { useState } from "react";
import { useAuth } from "@/modules/auth/client/use-auth";
import { TRPCClientError } from "@trpc/client";
import { useAuthMessages } from "../../../i18n/use-auth-messages";
type Props = {
  email: string;
  setEmail: (email: string) => void;
  setStep: (step: StepType) => void;
};
export default function StepEmail({ email, setEmail, setStep }: Props) {
  const copy = useAuthMessages().modal;
  const { checkEmailMutation } = useAuth();
  const [emailFormatError, setEmailFormatError] = useState("");
  const [apiError, setApiError] = useState("");
  const handleChangeEmail = (email: string) => {
    if (emailFormatError) setEmailFormatError("");
    if (apiError) setApiError("");
    setEmail(email);
  };
  const handleCancel = () => {
    // setEmailFormatError("");
    setEmail("");
    setStep("select");
  };
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    // 1. Zod 校验
    const validate = stepEmailSchema.safeParse({ email });
    if (!validate.success) {
      const msg =
        validate.error.formErrors.fieldErrors.email?.[0] || copy.invalidEmail;
      setEmailFormatError(msg);
      return;
    }
    // 2. 接口校验
    try {
      //   const result = await checkEmail.refetch();
      const data = await checkEmailMutation.mutateAsync({ email });
      // 根据是否存在跳转到登录或注册
      setStep(data.exists ? "login" : "signup");
    } catch (error) {
      if (error instanceof TRPCClientError) {
        const msg =
          error.message === "EMAIL_CHECK_FAILED"
            ? copy.serverError
            : copy.unexpectedError;
        setApiError(msg);
      } else {
        setApiError(copy.networkError);
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleCheckEmail}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        {copy.emailLogin}
      </h3>

      <FloatInput
        label={copy.email}
        value={email}
        onChange={handleChangeEmail}
        error={emailFormatError}
      />

      {apiError && (
        <p className="text-danger-text text-sm text-center">{apiError}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton
          type="button"
          onClick={handleCancel}
          variant="stepCancel"
        >
          {copy.cancel}
        </LoadingButton>
        <LoadingButton
          type="submit"
          loading={checkEmailMutation.isLoading}
          loadingText={copy.checking}
        >
          {copy.confirm}
        </LoadingButton>
      </div>
    </form>
  );
}
