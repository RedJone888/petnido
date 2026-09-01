import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { IntentForm } from "@/modules/onboarding/client/intent-form";
import { OnboardingShell } from "@/modules/onboarding/client/onboarding-shell";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function OnboardingIntentPage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const { userId, prisma } = await getServerUserContext();
  if (!userId) redirect("/");
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { onboardingStep: true } });
  const safeReturnTo = sanitizeReturnTo(searchParams.returnTo);
  if (profile?.onboardingStep !== "INTENT") redirect(`/auth/continue?returnTo=${encodeURIComponent(safeReturnTo)}`);
  return (
    <OnboardingShell step="INTENT">
      <IntentForm returnTo={safeReturnTo} />
    </OnboardingShell>
  );
}
