"use client";

import { useOnboardingMessages } from "../i18n/use-onboarding-messages";

export function OnboardingShell({
  step,
  children,
  variant,
}: {
  step: "PROFILE" | "INTENT" | "PROVIDER_PROFILE";
  children: React.ReactNode;
  variant?: "POST_NEED";
}) {
  const { copy } = useOnboardingMessages();
  const content =
    step === "PROFILE"
      ? {
          eyebrow: variant === "POST_NEED" ? copy.postNeedProfileEyebrow : copy.profileEyebrow,
          title: variant === "POST_NEED" ? copy.postNeedProfileTitle : copy.profileTitle,
          description: variant === "POST_NEED" ? copy.postNeedProfileDescription : copy.profileDescription,
        }
      : step === "INTENT"
        ? {
            eyebrow: copy.intentEyebrow,
            title: copy.intentTitle,
            description: copy.intentDescription,
          }
        : {
            eyebrow: copy.providerEyebrow,
            title: copy.providerTitle,
            description: copy.providerDescription,
          };

  return (
    <main className="min-h-[calc(100vh-81px)] bg-[#f6f3fa] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-purple-100 bg-white p-6 shadow-xl shadow-purple-100/50 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">{content.title}</h1>
        <p className="mt-3 leading-7 text-slate-600">{content.description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
