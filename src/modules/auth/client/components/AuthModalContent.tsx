"use client";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import StepSelect from "./steps/StepSelect";
import StepEmail from "./steps/StepEmail";
import StepLogin from "./steps/StepLogin";
import StepSignup from "./steps/StepSignup";
import StepVerify from "./steps/StepVerify";
import { useAuthModal } from "../auth-modal-provider";
import type { StepType } from "@/modules/auth/schemas";
import { useAuth } from "@/modules/auth/client/use-auth";
import cn from "@/lib/cn";
import { toast } from "sonner";
import {
  authContinuationUrl,
  sanitizeReturnTo,
} from "@/modules/auth/return-to";
import { useAuthMessages } from "../../i18n/use-auth-messages";

export default function AuthModalContent() {
  const copy = useAuthMessages().modal;
  const router = useRouter();
  const [step, setStep] = useState<StepType>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUserName] = useState("");
  const [coolDown, setCoolDown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 记得在组件销毁时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  const { closeAuthModal, returnTo } = useAuthModal();
  // 统一跳转方法
  const handleSuccessRedirect = () => {
    const redirectUrl = sanitizeReturnTo(returnTo, "/");
    localStorage.removeItem("authRedirect"); // 及时清理
    router.push(authContinuationUrl(redirectUrl));
    closeAuthModal();
  };
  const { sendVerifyCode } = useAuth();
  const startTimer = () => {
    setCoolDown(60); // 设置为 60 秒冷却
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCoolDown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  // 统一的发送/重发方法
  const handleSendCode = async (): Promise<void> => {
    if (coolDown > 0) return; // 冷却中禁止点击
    // 注意：这里不直接 setApiError，而是把错误抛给调用者
    try {
      await sendVerifyCode.mutateAsync({ email, username });
      toast.success(copy.sending);
      // 发送成功后开启倒计时
      startTimer();
    } catch (error) {
      // 这里的 error 会被子组件的 try...catch 捕获
      throw error;
    }
  };

  return (
    <>
      <div
        className="animate-fadeIn relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-5 shadow-xl sm:p-10"
        onClick={(e) => e.stopPropagation()} // 防止点击内容区也关闭弹窗
      >
        {/* 背景图 */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-100 via-white to-purple-100 rounded-3xl" />

        {/* Close button */}
        <button
          onClick={() => closeAuthModal()}
          type="button"
          aria-label={copy.closeDialog}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-2xl text-gray-700 transition hover:bg-black/20"
        >
          ×
        </button>
        <div className="relative z-10 flex h-[min(500px,calc(100dvh-88px))] min-h-[420px] flex-col">
          {/* Title */}
          <div className="text-center pb-6 shrink-0">
            <h2 className="pr-8 text-2xl font-bold tracking-tight text-gray-800 whitespace-pre-line sm:pr-0 sm:text-3xl">
              {copy.welcome}
            </h2>
            <p className="text-gray-600 mt-2 whitespace-pre-line">
              {copy.signInOrSignup}
            </p>
          </div>
          <div
            className={cn(
              "flex-1 overflow-y-auto px-1 sm:px-6",
              step === "select"
                ? "flex flex-col items-center justify-center"
                : "py-6 space-y-8",
            )}
          >
            {step === "select" ? (
              <>
                <StepSelect
                  setStep={setStep}
                  onGoogle={() => {
                    const target = sanitizeReturnTo(returnTo, "/");
                    signIn("google", {
                      redirectTo: authContinuationUrl(target),
                    });
                  }}
                  onLine={() => {
                    const target = sanitizeReturnTo(returnTo, "/");
                    signIn("line", {
                      redirectTo: authContinuationUrl(target),
                    });
                  }}
                />
                <p className="text-left text-xs text-neutral-500 mt-8">
                  {copy.termsAgreement}{" "}
                  <Link href="/terms" className="underline hover:text-neutral-700">
                    {copy.terms}
                  </Link>
                  {" "}{copy.and}{" "}
                  <Link
                    href="/privacy"
                    className="underline hover:text-neutral-700"
                  >
                    {copy.privacy}
                  </Link>
                  。
                </p>
              </>
            ) : (
              <>
                {step === "email" && (
                  <StepEmail
                    email={email}
                    setEmail={setEmail}
                    setStep={setStep}
                  />
                )}
                {step === "login" && (
                  <StepLogin
                    email={email}
                    setStep={setStep}
                    handleSuccessRedirect={handleSuccessRedirect}
                  />
                )}
                {step === "signup" && (
                  <StepSignup
                    email={email}
                    username={username}
                    setUserName={setUserName}
                    password={password}
                    setPassword={setPassword}
                    setStep={setStep}
                    handleSendCode={handleSendCode}
                    loading={sendVerifyCode.isLoading}
                  />
                )}
                {step === "verify" && (
                  <StepVerify
                    email={email}
                    username={username}
                    password={password}
                    sendCodeLoading={sendVerifyCode.isLoading}
                    handleSendCode={handleSendCode}
                    coolDown={coolDown}
                    handleSuccessRedirect={handleSuccessRedirect}
                  />
                )}
                {/* Terms 区域 */}
                <div className="flex justify-end gap-4 text-xs text-gray-500">
                  <Link href="/terms" className="hover:underline">
                    {copy.terms}
                  </Link>
                  <Link href="/privacy" className="hover:underline">
                    {copy.privacy}
                  </Link>
                </div>
              </>
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
    </>
  );
}
