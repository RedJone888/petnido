import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OnboardingShell } from "../_components/onboarding-shell";
import { OnboardingProfileForm } from "./profile-form";

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, image: true, profile: { select: { onboardingStep: true } } },
  });
  const safeReturnTo = sanitizeReturnTo(searchParams.returnTo);
  if (user.profile?.onboardingStep !== "PROFILE") {
    redirect(`/auth/continue?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }

  return (
    <OnboardingShell
      eyebrow="Step 1 of 2"
      title="まず、あなたのことを教えてください"
      description="ニックネームとアバターは、相談や予約の相手に表示されます。あとから変更できます。"
    >
      <OnboardingProfileForm
        initialNickname={user.name ?? ""}
        initialAvatar={user.image}
        returnTo={safeReturnTo}
      />
    </OnboardingShell>
  );
}
