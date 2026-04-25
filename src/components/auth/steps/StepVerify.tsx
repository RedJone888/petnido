import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { LoadingButton } from "@/components/shared/loading-button";
import { useAuth } from "@/hooks/useAuth";
import { TRPCClientError } from "@trpc/client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
type Props = {
  email: string;
  username: string;
  password: string;
  sendCodeLoading: boolean;
  handleSendCode: () => void;
  coolDown: number;
  handleSuccessRedirect: () => void;
};
export default function StepVerify({
  email,
  username,
  password,
  sendCodeLoading,
  handleSendCode,
  coolDown,
  handleSuccessRedirect,
}: Props) {
  const [code, setCode] = useState("");
  const [apiError, setApiError] = useState("");
  const { verifyCode } = useAuth();
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyCode.mutateAsync({ email, password, username, code });
      const result = await signIn("credentials", {
        email,
        password: "MAGIC_LINK",
        redirect: false,
      });
      if (result.error) {
        toast.error("ログインに失敗しました");
        return;
      }
      toast.success("メール認証が完了しました。", {
        description: "ようこそ、PetNido へ！",
        duration: 3000,
      });
      handleSuccessRedirect();
    } catch (error) {
      if (error instanceof TRPCClientError) {
        if (error.message === "INVALID_CODE") {
          setApiError("認証コードが正しくありません");
        } else if (error.message === "USER_CREATE_FAILED") {
          setApiError("ユーザーの作成に失敗しました。");
        }
      } else {
        setApiError("エラーが発生しました");
      }
      //   router.push("/");
    }
  };

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

      {apiError && (
        <p className="text-red-500 text-sm text-center">{apiError}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton
          disabled={coolDown > 0}
          loading={sendCodeLoading}
          loadingText="送信中..."
          onClick={handleSendCode}
          variant="stepCancel"
          disabledText={`あと${coolDown}秒`}
        >
          再送信
        </LoadingButton>
        <LoadingButton
          type="submit"
          loading={verifyCode.isLoading}
          loadingText="確認中..."
          disabled={code.length !== 6}
        >
          確認する
        </LoadingButton>
      </div>
    </form>
  );
}
