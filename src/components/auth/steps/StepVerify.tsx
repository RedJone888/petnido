import VerificationCodeInput from "@/components/auth/VerificationCodeInput";
import { LoadingButton } from "@/components/ui/LoadingButton";
export default function StepVerify({
  code,
  setCode,
  handleVerifyCode,
  sendCodeLoading,
  verifyCodeLoading,
  handleResend,
  coolDown,
  errorMsg,
}: {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  handleVerifyCode: (e: React.FormEvent) => void;
  sendCodeLoading: boolean;
  verifyCodeLoading: boolean;
  handleResend: () => void;
  coolDown: number;
  errorMsg: string;
}) {
  return (
    <form className="space-y-6" onSubmit={handleVerifyCode}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        認証コード確認
      </h3>
      <p className="text-gray-600 text-sm whitespace-pre-line">
        メールに送信された6桁の認証コードを入力してください。
        コードの有効期限は数分ですので、お早めにご確認ください。
      </p>
      <VerificationCodeInput value={code} onChange={setCode} />

      {errorMsg && (
        <p className="text-red-500 text-sm text-center">{errorMsg}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton
          disabled={coolDown > 0}
          loading={sendCodeLoading}
          loadingText="送信中..."
          onClick={handleResend}
          variant="stepCancel"
          disabledText={`あと${coolDown}秒`}
        >
          再送信
        </LoadingButton>
        <LoadingButton
          type="submit"
          loading={verifyCodeLoading}
          loadingText="確認中..."
          disabled={code.length !== 6}
        >
          確認する
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
