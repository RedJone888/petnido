import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  const { userId, prisma, isValidationSession } = await getServerUserContext();
  if (!userId) redirect("/");

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { onboardingStep: true, lineFirstUseCompletedAt: true },
  });
  const returnTo = encodeURIComponent(
    sanitizeReturnTo(searchParams.returnTo, "/dashboard"),
  );

  if (!isValidationSession && !profile.lineFirstUseCompletedAt) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        passwordHash: true,
        accounts: { select: { provider: true } },
      },
    });
    const isLineOnly =
      !user?.email &&
      !user?.passwordHash &&
      user?.accounts.length === 1 &&
      user.accounts[0]?.provider === "line";
    if (isLineOnly) redirect(`/auth/line-first-use?returnTo=${returnTo}`);
  }

  if (profile.onboardingStep === "PROFILE") {
    redirect(`/onboarding/profile?returnTo=${returnTo}`);
  }
  if (profile.onboardingStep === "INTENT") {
    redirect(`/onboarding/intent?returnTo=${returnTo}`);
  }
  if (profile.onboardingStep === "PROVIDER_PROFILE") {
    redirect(`/onboarding/provider-profile?returnTo=${returnTo}`);
  }
  redirect(sanitizeReturnTo(searchParams.returnTo, "/dashboard"));
}
