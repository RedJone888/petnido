import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { OnboardingShell } from "@/modules/onboarding/client/onboarding-shell";
import { ProviderProfileForm } from "@/modules/onboarding/client/provider-profile-form";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function ProviderOnboardingPage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const { userId, prisma } = await getServerUserContext();
  if (!userId) redirect("/");
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { onboardingStep: true } });
  const safeReturnTo = sanitizeReturnTo(searchParams.returnTo, "/dashboard/serviceprofile");
  if (profile?.onboardingStep !== "PROVIDER_PROFILE") redirect(`/auth/continue?returnTo=${encodeURIComponent(safeReturnTo)}`);
  return (
    <OnboardingShell step="PROVIDER_PROFILE">
      <ProviderProfileForm returnTo={safeReturnTo} />
    </OnboardingShell>
  );
}
