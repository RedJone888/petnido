import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { OnboardingProfileForm } from "@/modules/onboarding/client/profile-form";
import { OnboardingShell } from "@/modules/onboarding/client/onboarding-shell";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  const { userId, prisma } = await getServerUserContext();
  if (!userId) redirect("/");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, image: true, profile: { select: { onboardingStep: true } } },
  });
  const safeReturnTo = sanitizeReturnTo(searchParams.returnTo);
  if (user.profile?.onboardingStep !== "PROFILE") {
    redirect(`/auth/continue?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }

  return (
    <OnboardingShell step="PROFILE">
      <OnboardingProfileForm
        initialNickname={user.name ?? ""}
        initialAvatar={user.image}
        returnTo={safeReturnTo}
      />
    </OnboardingShell>
  );
}
