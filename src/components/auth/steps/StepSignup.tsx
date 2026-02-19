import type { Errors } from "@/components/auth/AuthModal";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { LoadingButton } from "@/components/ui/LoadingButton";
export default function StepSignup({
  handleSignup,
  email,
  username,
  handleChangeUsername,
  password,
  handleChangePassword,
  loading,
  verifyErrors,
  handleCancel,
  errorMsg,
}: {
  handleSignup: (e: React.FormEvent) => void;
  email: string;
  username: string;
  handleChangeUsername: (v: string) => void;
  password: string;
  handleChangePassword: (v: string) => void;
  loading: boolean;
  verifyErrors: Errors;
  handleCancel: () => void;
  errorMsg: string;
}) {
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
        error={verifyErrors.username}
      />
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
        <LoadingButton variant="ghost" onClick={handleCancel}>
          キャンセル
        </LoadingButton>
        <LoadingButton type="submit" loading={loading} loadingText="登録中...">
          登録する
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
