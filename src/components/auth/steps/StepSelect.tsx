import { Button } from "@/components/ui/Button";
import { StepSetter } from "../AuthModal";
import { SiGoogle, SiApple, SiLine } from "react-icons/si";
import { Mail } from "lucide-react";
import Image from "next/image";
import Google from "/public/icons/google.svg";
export default function StepSelect({
  setStep,
  onGoogle,
  onLine,
}: {
  setStep: StepSetter;
  onGoogle: () => void;
  onLine: () => void;
}) {
  const btnClass = "w-full gap-3 rounded-xl px-4 py-3";
  return (
    <>
      <div className="space-y-6">
        <Button
          className={btnClass}
          variant="primary"
          onClick={() => setStep("email")}
        >
          <Mail size={20} />
          メールで続ける
        </Button>
        <Button variant="outlineDark" className={btnClass} onClick={onGoogle}>
          <Image src="/icons/google.svg" alt="Google" width={20} height={20} />
          {/* <Google className="w-20 h-20" /> */}
          Google で続ける
        </Button>
        {/* <Button variant="outlineDark" className={btnClass} onClick={onApple}>
          <SiApple size={20} color="#000" />
          Apple で続ける
        </Button> */}
        <Button variant="outlineDark" className={btnClass} onClick={onLine}>
          <SiLine size={20} color="#06C755" />
          LINE で続ける
        </Button>
      </div>
      <p className="text-left text-xs text-neutral-500 mt-8">
        続行することで、
        <a href="/terms" className="underline hover:text-neutral-700">
          利用規約
        </a>
        および
        <a href="/privacy" className="underline hover:text-neutral-700">
          プライバシーポリシー
        </a>
        に同意したものとみなされます。
      </p>
    </>
  );
}
