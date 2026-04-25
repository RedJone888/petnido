import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import StepSelect from "./steps/StepSelect";
import StepEmail from "./steps/StepEmail";
import StepLogin from "./steps/StepLogin";
import StepSignup from "./steps/StepSignup";
import StepVerify from "./steps/StepVerify";
import { useAuthModal } from "@/components/providers/AuthModalProvider";
import type { StepType } from "@/domain/auth/type";
import { useAuth } from "@/hooks/useAuth";
import cn from "@/lib/cn";
import { toast } from "sonner";

export default function AuthModalContent() {
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
  const { closeAuthModal } = useAuthModal();
  // 统一跳转方法
  const handleSuccessRedirect = () => {
    const redirectUrl = localStorage.getItem("authRedirect") || "/";
    const curretPath = window.location.pathname;
    localStorage.removeItem("authRedirect"); // 及时清理
    if (redirectUrl === curretPath && curretPath.startsWith("/public")) {
      closeAuthModal();
    } else {
      router.push(redirectUrl);
      closeAuthModal();
    }
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
      toast.success("認証コードを送信しました");
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
        className="relative bg-white w-full max-w-md rounded-3xl shadow-xl p-10 animate-fadeIn"
        onClick={(e) => e.stopPropagation()} // 防止点击内容区也关闭弹窗
      >
        {/* 背景图 */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-100 via-white to-purple-100 rounded-3xl" />

        {/* Close button */}
        <button
          onClick={() => closeAuthModal()}
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
            className={cn(
              "flex-1 overflow-y-auto px-6",
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
                    const url =
                      localStorage.getItem("authRedirect") ||
                      window.location.pathname;
                    signIn("google", { redirectTo: url });
                  }}
                  onLine={() => {
                    const url =
                      localStorage.getItem("authRedirect") ||
                      window.location.pathname;
                    signIn("line", { redirectTo: url });
                  }}
                />
                <p className="text-left text-xs text-neutral-500 mt-8">
                  続行することで、
                  <a href="/terms" className="underline hover:text-neutral-700">
                    利用規約
                  </a>
                  および
                  <a
                    href="/privacy"
                    className="underline hover:text-neutral-700"
                  >
                    プライバシーポリシー
                  </a>
                  に同意したものとみなされます。
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
                  <a href="/terms" className="hover:underline">
                    利用規約
                  </a>
                  <a href="/privacy" className="hover:underline">
                    プライバシーポリシー
                  </a>
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
