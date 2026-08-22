"use client";
import { Button } from "@/components/ui/button";
import { SiLine } from "react-icons/si";
import { Mail } from "lucide-react";
import Image from "next/image";
import type { StepType } from "@/modules/auth/schemas";
import { useAuthMessages } from "../../../i18n/use-auth-messages";
type Props = {
  setStep: (step: StepType) => void;
  onGoogle: () => void;
  onLine: () => void;
};
export default function StepSelect({ setStep, onGoogle, onLine }: Props) {
  const copy = useAuthMessages().modal;
  const btnClass = "w-full gap-3 rounded-xl px-4 py-3";
  return (
    <div className="space-y-6">
      <Button
        className={btnClass}
        variant="primary"
        onClick={() => setStep("email")}
      >
        <Mail size={20} />
        {copy.continueWithEmail}
      </Button>
      <Button variant="outlineDark" className={btnClass} onClick={onGoogle}>
        <Image src="/icons/google.svg" alt="Google" width={20} height={20} />
        {copy.continueGoogle}
      </Button>
      <Button variant="outlineDark" className={btnClass} onClick={onLine}>
        <SiLine size={20} color="#06C755" />
        {copy.continueLine}
      </Button>
    </div>
  );
}
