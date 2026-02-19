import type { Errors } from "@/components/auth/AuthModal";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { LoadingButton } from "@/components/ui/LoadingButton";

export default function StepEmail({
  email,
  handleChangeEmail,
  handleCheckEmail,
  verifyErrors,
  loading,
  handleCancel,
  errorMsg,
}: {
  email: string;
  handleChangeEmail: (v: string) => void;
  handleCheckEmail: (e: React.FormEvent) => void;
  verifyErrors: Errors;
  loading: boolean;
  handleCancel: () => void;
  errorMsg: string;
}) {
  return (
    <form className="space-y-6" onSubmit={handleCheckEmail}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        メールでログイン
      </h3>

      <FloatingInput
        label="メールアドレス"
        value={email}
        onChange={handleChangeEmail}
        error={verifyErrors.email}
      />

      {errorMsg && (
        <p className="text-red-500 text-sm text-center">{errorMsg}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton onClick={handleCancel} variant="stepCancel">
          キャンセル
        </LoadingButton>
        <LoadingButton type="submit" loading={loading} loadingText="確認中...">
          次へ
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
