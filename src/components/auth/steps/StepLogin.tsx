"use client";
import { FloatInput } from "@/components/shared/float-input";
import { LoadingButton } from "@/components/shared/loading-button";
import type { StepType } from "@/domain/auth/type";
import { useState } from "react";
import { stepLoginSchema } from "@/lib/zod/auth";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
type Props = {
  email: string;
  setStep: (step: StepType) => void;
  handleSuccessRedirect: () => void;
};
export default function StepLogin({
  email,
  setStep,
  handleSuccessRedirect,
}: Props) {
  const [password, setPassword] = useState("");
  const [passwordFormatError, setPasswordFormatError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const handleChangePassword = (password: string) => {
    if (passwordFormatError) setPasswordFormatError("");
    if (apiError) setApiError("");
    setPassword(password);
  };
  const handleCancel = () => {
    setPassword("");
    setStep("email");
  };
  // 2. 普通密码登录逻辑
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    // 1. Zod 校验
    const validate = stepLoginSchema.safeParse({ email, password });
    if (!validate.success) {
      const msg =
        validate.error.formErrors.fieldErrors.password?.[0] ||
        "パスワードを入力してください";
      setPasswordFormatError(msg);
      return;
    }
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // 必须为 false，否则 NextAuth 会接管跳转
      });
      if (result?.error) {
        setApiError("メールアドレスまたはパスワードが正しくありません。");
        return;
      }
      // 登录成功
      toast.success("ログインしました！");
      handleSuccessRedirect(); // 执行自动跳转
    } catch (error) {
      // 这里的 catch 捕获的是浏览器级别的网络异常或代码崩溃
      setApiError("ネットワークエラーが発生しました");
    } finally {
      setLoginLoading(false);
    }
  };
  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        ログイン
      </h3>
      <FloatInput label="メールアドレス" value={email} editable={false} />

      <FloatInput
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
        <LoadingButton type="button" onClick={handleCancel} variant="ghost">
          キャンセル
        </LoadingButton>
        <LoadingButton
          type="submit"
          loading={loginLoading}
          loadingText="確認中..."
        >
          ログインする
        </LoadingButton>
      </div>
    </form>
  );
}
