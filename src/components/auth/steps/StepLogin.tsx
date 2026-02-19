import { FloatingInput } from "@/components/ui/FloatingInput";
import type { Errors } from "@/components/auth/AuthModal";
import { LoadingButton } from "@/components/ui/LoadingButton";
export default function StepLogin({
  handleLogin,
  email,
  password,
  handleChangePassword,
  verifyErrors,
  loading,
  handleCancel,
  errorMsg,
}: {
  handleLogin: (e: React.FormEvent) => void;
  email: string;
  password: string;
  handleChangePassword: (v: string) => void;
  verifyErrors: Errors;
  loading: boolean;
  handleCancel: () => void;
  errorMsg: string;
}) {
  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        ログイン
      </h3>
      <FloatingInput label="メールアドレス" value={email} editable={false} />

      <FloatingInput
        type="password"
        label="パスワード"
        value={password}
        onChange={handleChangePassword}
        error={verifyErrors.password}
      />

      {errorMsg && (
        <p className="text-red-500 text-sm text-center">{errorMsg}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton onClick={handleCancel} variant="ghost">
          キャンセル
        </LoadingButton>
        <LoadingButton type="submit" loading={loading} loadingText="確認中...">
          ログインする
        </LoadingButton>
      </div>
      {/* Terms 区域 */}
      <div className="flex justify-end gap-4 text-xs text-gray-500">
        <a href="/terms" className="hover:underline">
          利用規約
        </a>
        <a href="/privacy" className="hover:underline">
          プライバシーポリシー
        </a>
      </div>
    </form>
  );
}
