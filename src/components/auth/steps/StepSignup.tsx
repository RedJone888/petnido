"use client";
import type { StepType } from "@/domain/auth/type";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { stepSignupLinkSchema } from "@/lib/zod/auth";
import { useState } from "react";
import { TRPCClientError } from "@trpc/client";
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
            ? "メールの送信に失敗しました。メールアドレスをご確認ください。"
            : "サーバーエラーが発生しました。しばらくしてからお試しください。";
        setApiError(msg);
      }
    }
  };
  return (
    <form className="space-y-6" onSubmit={handleSignup}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        新規登録
      </h3>
      <FloatingInput label="メールアドレス" value={email} editable={false} />
      <FloatingInput
        label="ユーザー名"
        value={username}
        onChange={handleChangeUsername}
        error={usernameFormatError}
      />
      <FloatingInput
        type="password"
        label="パスワード"
        value={password}
        onChange={handleChangePassword}
        error={passwordFormatError}
      />

      {apiError && (
        <p className="text-red-500 text-sm text-center">{apiError}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton variant="ghost" onClick={handleCancel}>
          キャンセル
        </LoadingButton>
        <LoadingButton type="submit" loading={loading} loadingText="登録中...">
          登録する
        </LoadingButton>
      </div>
    </form>
  );
}
