import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
    select: { onboardingStep: true },
  });
  const returnTo = encodeURIComponent(
    sanitizeReturnTo(searchParams.returnTo, "/dashboard"),
  );

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
