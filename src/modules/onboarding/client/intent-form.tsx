"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Binoculars, BriefcaseBusiness, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { initialIntentDestination } from "@/modules/auth/return-to";
import { trpc } from "@/utils/trpc";

import { useOnboardingMessages } from "../i18n/use-onboarding-messages";

type InitialIntent = "POST_NEED" | "OFFER_SERVICE" | "BROWSE";

export function IntentForm({ returnTo }: { returnTo: string }) {
  const { copy } = useOnboardingMessages();
  const router = useRouter();
  const [confirmProvider, setConfirmProvider] = useState(false);
  const mutation = trpc.profile.chooseInitialIntent.useMutation();

  async function choose(intent: InitialIntent) {
    try {
      const result = await mutation.mutateAsync({ intent });
      const destination = initialIntentDestination(intent, returnTo);
      router.replace(
        result.nextStep === "PROVIDER_PROFILE"
          ? `/onboarding/provider-profile?returnTo=${encodeURIComponent(destination)}`
          : destination,
      );
    } catch {
      toast.error(copy.intentError);
    }
  }

  if (confirmProvider) {
    return (
      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6">
        <h2 className="text-xl font-black text-slate-900">{copy.confirmProviderTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy.confirmProviderDescription}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => setConfirmProvider(false)}>
            {copy.back}
          </Button>
          <Button type="button" disabled={mutation.isLoading} onClick={() => choose("OFFER_SERVICE")}>
            {copy.confirmContinue}
          </Button>
        </div>
      </div>
    );
  }

  const choiceClass =
    "rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-primary hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button type="button" disabled={mutation.isLoading} onClick={() => choose("POST_NEED")} className={choiceClass}>
        <HeartHandshake className="h-8 w-8 text-primary" />
        <strong className="mt-5 block text-lg text-slate-900">{copy.requestCare}</strong>
        <span className="mt-2 block text-sm leading-6 text-slate-600">{copy.requestCareDescription}</span>
      </button>
      <button type="button" disabled={mutation.isLoading} onClick={() => setConfirmProvider(true)} className={choiceClass}>
        <BriefcaseBusiness className="h-8 w-8 text-primary" />
        <strong className="mt-5 block text-lg text-slate-900">{copy.offerCare}</strong>
        <span className="mt-2 block text-sm leading-6 text-slate-600">{copy.offerCareDescription}</span>
      </button>
      <button type="button" disabled={mutation.isLoading} onClick={() => choose("BROWSE")} className={`${choiceClass} sm:col-span-2 sm:flex sm:items-center sm:gap-5`}>
        <Binoculars className="h-8 w-8 shrink-0 text-primary" />
        <span>
          <strong className="mt-5 block text-lg text-slate-900 sm:mt-0">{copy.browse}</strong>
          <span className="mt-2 block text-sm leading-6 text-slate-600">{copy.browseDescription}</span>
        </span>
      </button>
    </div>
  );
}
