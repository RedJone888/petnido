"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { trpc } from "@/utils/trpc";

import { useOnboardingMessages } from "../i18n/use-onboarding-messages";

export function ProviderProfileForm({ returnTo }: { returnTo: string }) {
  const { copy } = useOnboardingMessages();
  const router = useRouter();
  const [introduction, setIntroduction] = useState("");
  const [monthsExperience, setMonthsExperience] = useState(0);
  const mutation = trpc.serviceProfile.completeOnboarding.useMutation();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await mutation.mutateAsync({ introduction, monthsExperience });
      router.replace(sanitizeReturnTo(returnTo, "/dashboard/serviceprofile/services/new"));
    } catch {
      toast.error(copy.providerError);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">{copy.introduction}</span>
        <textarea required maxLength={2000} rows={7} value={introduction} onChange={(event) => setIntroduction(event.target.value)} className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100" placeholder={copy.introductionPlaceholder} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">{copy.experienceMonths}</span>
        <input type="number" min={0} max={1200} value={monthsExperience} onChange={(event) => setMonthsExperience(Number(event.target.value))} className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100" />
      </label>
      <p className="text-sm leading-6 text-slate-500">{copy.providerDefaultsHelp}</p>
      <Button type="submit" disabled={mutation.isLoading || !introduction.trim()} className="w-full">
        {mutation.isLoading ? copy.creating : copy.createProfile}
      </Button>
    </form>
  );
}
