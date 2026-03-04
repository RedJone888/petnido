"use client";
import type { StepType } from "@/domain/auth/type";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { stepEmailSchema } from "@/lib/zod/auth";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TRPCClientError } from "@trpc/client";
type Props = {
  email: string;
  setEmail: (email: string) => void;
  setStep: (step: StepType) => void;
};
export default function StepEmail({ email, setEmail, setStep }: Props) {
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
        validate.error.formErrors.fieldErrors.email?.[0] || "無効な形式です";
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
            ? "サーバーエラーが発生しました。しばらくしてからもう一度お試しください。"
            : "予期しないエラーが発生しました";
        setApiError(msg);
      } else {
        setApiError("ネットワークエラーが発生しました");
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleCheckEmail}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        メールでログイン
      </h3>

      <FloatingInput
        label="メールアドレス"
        value={email}
        onChange={handleChangeEmail}
        error={emailFormatError}
      />

      {apiError && (
        <p className="text-red-500 text-sm text-center">{apiError}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton
          type="button"
          onClick={handleCancel}
          variant="stepCancel"
        >
          キャンセル
        </LoadingButton>
        <LoadingButton
          type="submit"
          loading={checkEmailMutation.isLoading}
          loadingText="確認中..."
        >
          次へ
        </LoadingButton>
      </div>
    </form>
  );
}
