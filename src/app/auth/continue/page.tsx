import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { isNeedPublishingContinuation } from "@/modules/need-publishing/server/continuation";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function AuthContinuePage(
  props: {
    searchParams: Promise<{ returnTo?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const { userId, prisma, isValidationSession } = await getServerUserContext();
  if (!userId) redirect("/");

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { onboardingStep: true, lineFirstUseCompletedAt: true },
  });
  const safeReturnTo = sanitizeReturnTo(searchParams.returnTo, "/dashboard");
  const returnTo = encodeURIComponent(safeReturnTo);
  const isNeedPublishingFlow = isNeedPublishingContinuation(safeReturnTo);

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
    redirect(
      `/onboarding/profile?returnTo=${returnTo}${
        isNeedPublishingFlow ? "&variant=post_need" : ""
      }`,
    );
  }
  if (profile.onboardingStep === "INTENT") {
    if (isNeedPublishingFlow) {
      await prisma.profile.updateMany({
        where: { userId, onboardingStep: "INTENT" },
        data: { initialIntent: "POST_NEED", onboardingStep: "COMPLETE" },
      });
      redirect(safeReturnTo);
    }
    redirect(`/onboarding/intent?returnTo=${returnTo}`);
  }
  if (profile.onboardingStep === "PROVIDER_PROFILE") {
    redirect(`/onboarding/provider-profile?returnTo=${returnTo}`);
  }
  redirect(sanitizeReturnTo(searchParams.returnTo, "/dashboard"));
}
