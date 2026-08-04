import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OnboardingShell } from "../_components/onboarding-shell";
import { ProviderProfileForm } from "./provider-profile-form";

export default async function ProviderOnboardingPage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id }, select: { onboardingStep: true } });
  const safeReturnTo = sanitizeReturnTo(searchParams.returnTo, "/dashboard/serviceprofile");
  if (profile?.onboardingStep !== "PROVIDER_PROFILE") redirect(`/auth/continue?returnTo=${encodeURIComponent(safeReturnTo)}`);
  return (
    <OnboardingShell eyebrow="Service profile" title="提供できるお世話について教えてください" description="まずは経験と自己紹介を登録します。具体的なサービス内容、場所、料金は次のサービス作成時に設定します。">
      <ProviderProfileForm returnTo={safeReturnTo} />
    </OnboardingShell>
  );
}
