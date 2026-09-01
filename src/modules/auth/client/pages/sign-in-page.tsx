"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { sanitizeReturnTo } from "../../return-to";
import { useAuthMessages } from "../../i18n/use-auth-messages";
import { useAuthModal } from "../auth-modal-provider";
import { AuthPageCard } from "../components/auth-page-card";

export function SignInPageClient({ returnTo }: { returnTo: string }) {
  const copy = useAuthMessages().modal;
  const { openAuthModal } = useAuthModal();
  const safeReturnTo = sanitizeReturnTo(returnTo);
  useEffect(() => {
    openAuthModal(safeReturnTo);
  }, [openAuthModal, safeReturnTo]);

  return (
    <AuthPageCard title={copy.loginTitle}>
      <div className="text-center">
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy.signInOrSignup}</p>
        <Button className="mt-6 w-full" onClick={() => openAuthModal(safeReturnTo)}>{copy.signInOrSignup}</Button>
      </div>
    </AuthPageCard>
  );
}
