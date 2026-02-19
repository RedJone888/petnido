"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import StepSelect from "./steps/StepSelect";
import StepEmail from "./steps/StepEmail";
import StepLogin from "./steps/StepLogin";
import StepSignup from "./steps/StepSignup";
import StepVerify from "./steps/StepVerify";
import {
  stepEmailSchema,
  stepLoginSchema,
  stepSignupLinkSchema,
} from "@/lib/zod/auth";
type StepType = "select" | "email" | "login" | "signup" | "verify";
export type StepSetter = React.Dispatch<React.SetStateAction<StepType>>;
export type Errors = {
  email: string;
  password: string;
  username: string;
};
export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const router = useRouter();
  const [step, setStep] = useState<StepType>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUserName] = useState("");
  const [code, setCode] = useState("");
  const [coolDown, setCoolDown] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [verifyErrors, setVerifyErrors] = useState<Errors>({
    email: "",
    password: "",
    username: "",
  });
  const checkEmail = trpc.auth.checkEmailExist.useQuery(
    { email },
    { enabled: false }
  );
  const sendVerifyCode = trpc.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      setStep("verify");
    },
    onError: (err) => {
      if (err.message === "TOKEN_SAVE_FAILED") {
        toast.error(
          "サーバーエラーが発生しました。しばらくしてからお試しください。"
        );
      } else if (err.message === "EMAIL_SEND_FAILED") {
        toast.error(
          "メールの送信に失敗しました。メールアドレスをご確認ください。"
        );
      } else {
        toast.error("エラーが発生しました。");
      }
    },
  });
  const verifyCode = trpc.auth.verifyCode.useMutation({
    onSuccess: async ({ email }) => {
      await signIn("credentials", {
        email,
        password: "MAGIC_LINK",
        redirect: false,
      });
      toast.success("メール認証が完了しました。", {
        description: "ようこそ、PetNido へ！",
        duration: 3000,
      });
      handleClose();
      const redirectUrl = localStorage.getItem("authRedirect") || "/";
      localStorage.removeItem("authRedirect");
      router.push(redirectUrl);
    },
    onError: (err) => {
      if (err.message === "INVALID_CODE") {
        toast.error("認証コードが正しくありません");
      } else if (err.message === "USER_CREATE_FAILED") {
        toast.error("ユーザーの作成に失敗しました。");
      } else {
        toast.error("エラーが発生しました");
      }
      router.push("/");
    },
  });

  const clearErrors = () => {
    setVerifyErrors({
      email: "",
      password: "",
      username: "",
    });
  };
  const setStepErrors = (partialErrors: Partial<Errors>) => {
    setVerifyErrors((prev) => ({
      ...prev,
      ...partialErrors,
    }));
  };
  const handleCancel = () => {
    clearErrors();
    setEmail("");
    setUserName("");
    setPassword("");
    setStep("select");
  };
  const handleChangeEmail = (email: string) => {
    setStepErrors({ email: "" });
    setEmail(email);
  };
  const handleChangeUsername = (username: string) => {
    setStepErrors({ username: "" });
    setUserName(username);
  };
  const handleChangePassword = (password: string) => {
    setStepErrors({ password: "" });
    setPassword(password);
  };
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const validate = stepEmailSchema.safeParse({ email });
    if (!validate.success) {
      const emailErr = validate.error.formErrors.fieldErrors.email?.[0] || "";
      setStepErrors({ email: emailErr });
      return;
    }
    try {
      const result = await checkEmail.refetch();
      if (result.error) {
        const msg = result.error.message;
        if (msg === "EMAIL_CHECK_FAILED") {
          setErrorMsg(
            "サーバーエラーが発生しました。しばらくしてからもう一度お試しください。"
          );
        } else {
          setErrorMsg("予期しないエラーが発生しました");
        }
        return;
      }
      setStep(result.data?.exists ? "login" : "signup");
    } catch (e) {
      setErrorMsg("ネットワークエラーが発生しました");
    }
  };
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const validate = stepSignupLinkSchema.safeParse({
      email,
      password,
      username,
    });
    if (!validate.success) {
      const fieldErrors = validate.error.formErrors.fieldErrors;
      setStepErrors({
        email: fieldErrors.email?.[0] || "",
        password: fieldErrors.password?.[0] || "",
        username: fieldErrors.username?.[0] || "",
      });
      return;
    }
    handleResend();
  };
  const handleResend = () => {
    if (coolDown > 0) return; // 冷却中禁止点击
    setErrorMsg("");
    sendVerifyCode.mutate({ email, username });
    setCoolDown(60); // 设置为 60 秒冷却
    const interval = setInterval(() => {
      setCoolDown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode.mutate({ email, password, username, code });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const validate = stepLoginSchema.safeParse({ email, password });
    if (!validate.success) {
      const fieldErrors = validate.error.formErrors.fieldErrors;
      setStepErrors({
        email: fieldErrors.email?.[0] || "",
        password: fieldErrors.password?.[0] || "",
      });
      return;
    }
    setLoginLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      switch (result.error) {
        case "MISSING_CREDENTIALS":
          setErrorMsg("メールアドレスとパスワードを入力してください。");
          break;
        case "INVALID_EMAIL":
          setErrorMsg("このメールアドレスは登録されていません。");
          break;
        case "INVALID_PASSWORD":
          setErrorMsg("パスワードが正しくありません。");
          break;
        default:
          setErrorMsg("ログインに失敗しました。再度お試しください。");
          break;
      }
      setLoginLoading(false);
      return;
    }
    handleClose();
    toast.success("ログインしました！");
  };
  const handleClose = () => {
    setEmail("");
    setUserName("");
    setPassword("");
    setCode("");
    setCoolDown(0);
    setLoginLoading(false);
    setStep("select");
    setErrorMsg("");
    clearErrors();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="relative bg-white w-full max-w-md rounded-3xl shadow-xl p-10 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景图 */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-100 via-white to-purple-100 rounded-3xl" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 -left-24 w-10 h-10 bg-black/20 rounded-full text-white text-2xl flex items-center justify-center hover:bg-black/30 transition"
        >
          ×
        </button>
        <div className="relative flex flex-col h-[500px] z-10">
          {/* Title */}
          <div className="text-center pb-6 shrink-0">
            <h2 className="text-3xl font-bold text-gray-800 whitespace-pre-line tracking-tight">
              ようこそ、PetNido へ
            </h2>
            <p className="text-gray-600 mt-2 whitespace-pre-line">
              ログインまたは新規登録を行ってください
            </p>
          </div>
          <div
            className={`flex-1 overflow-y-auto px-6 ${
              step === "select"
                ? "flex flex-col items-center justify-center"
                : "py-6 space-y-8"
            }`}
          >
            {step === "select" && (
              <StepSelect
                setStep={setStep}
                onGoogle={() => signIn("google")}
                onLine={() => signIn("line")}
              />
            )}
            {step === "email" && (
              <StepEmail
                email={email}
                handleChangeEmail={handleChangeEmail}
                handleCheckEmail={handleCheckEmail}
                verifyErrors={verifyErrors}
                loading={checkEmail.isFetching}
                handleCancel={handleCancel}
                errorMsg={errorMsg}
              />
            )}
            {step === "login" && (
              <StepLogin
                email={email}
                password={password}
                handleChangePassword={handleChangePassword}
                verifyErrors={verifyErrors}
                errorMsg={errorMsg}
                handleLogin={handleLogin}
                loading={loginLoading}
                handleCancel={handleCancel}
              />
            )}
            {step === "signup" && (
              <StepSignup
                handleSignup={handleSignup}
                email={email}
                username={username}
                handleChangeUsername={handleChangeUsername}
                password={password}
                handleChangePassword={handleChangePassword}
                verifyErrors={verifyErrors}
                loading={sendVerifyCode.isLoading}
                handleCancel={handleCancel}
                errorMsg={errorMsg}
              />
            )}
            {step === "verify" && (
              <StepVerify
                code={code}
                setCode={setCode}
                handleVerifyCode={handleVerifyCode}
                sendCodeLoading={sendVerifyCode.isLoading}
                verifyCodeLoading={verifyCode.isLoading}
                handleResend={handleResend}
                coolDown={coolDown}
                errorMsg={errorMsg}
              />
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
