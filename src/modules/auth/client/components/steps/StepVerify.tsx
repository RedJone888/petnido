import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { LoadingButton } from "@/components/shared/loading-button";
import { useAuth } from "@/modules/auth/client/use-auth";
import { TRPCClientError } from "@trpc/client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthMessages } from "../../../i18n/use-auth-messages";
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
  const copy = useAuthMessages().modal;
  const [code, setCode] = useState("");
  const [apiError, setApiError] = useState("");
  const { verifyCode } = useAuth();
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyCode.mutateAsync({ email, password, username, code });
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result.error) {
        toast.error(copy.invalidCredentials);
        return;
      }
      toast.success(copy.verifySuccess, {
        description: copy.verifyWelcome,
        duration: 3000,
      });
      handleSuccessRedirect();
    } catch (error) {
      if (error instanceof TRPCClientError) {
        if (error.message === "INVALID_CODE") {
          setApiError(copy.codeInvalid);
        } else if (error.message === "CODE_EXPIRED") {
          setApiError(copy.codeExpired);
        } else if (error.message === "TOO_MANY_CODE_ATTEMPTS") {
          setApiError(copy.attemptsExceeded);
        } else if (error.message === "RATE_LIMITED") {
          setApiError(copy.rateLimited);
        } else if (error.message === "EMAIL_ALREADY_REGISTERED") {
          setApiError(copy.emailRegistered);
        } else if (error.message === "USER_CREATE_FAILED") {
          setApiError(copy.userCreateFailed);
        }
      } else {
        setApiError(copy.genericError);
      }
      //   router.push("/");
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleVerifyCode}>
      <h3 className="text-lg font-semibold text-gray-900 text-left mb-6">
        {copy.verifyTitle}
      </h3>
      <p className="text-gray-600 text-sm whitespace-pre-line">
        {copy.verifyDescription}
      </p>
      <VerificationCodeInput value={code} onChange={setCode} />

      {apiError && (
        <p className="text-danger-text text-sm text-center">{apiError}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <LoadingButton
          disabled={coolDown > 0}
          loading={sendCodeLoading}
          loadingText={copy.sending}
          onClick={handleSendCode}
          variant="stepCancel"
          disabledText={copy.resendIn.replace("{n}", String(coolDown))}
        >
          {copy.resend}
        </LoadingButton>
        <LoadingButton
          type="submit"
          loading={verifyCode.isLoading}
          loadingText={copy.confirming}
          disabled={code.length !== 6}
        >
          {copy.confirm}
        </LoadingButton>
      </div>
    </form>
  );
}
