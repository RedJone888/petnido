import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OnboardingShell } from "../_components/onboarding-shell";
import { IntentForm } from "./intent-form";

export default async function OnboardingIntentPage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id }, select: { onboardingStep: true } });
  const safeReturnTo = sanitizeReturnTo(searchParams.returnTo);
  if (profile?.onboardingStep !== "INTENT") redirect(`/auth/continue?returnTo=${encodeURIComponent(safeReturnTo)}`);
  return (
    <OnboardingShell eyebrow="Step 2 of 2" title="PetNidoで何をしたいですか？" description="この選択は最初の案内にだけ使います。ひとつのアカウントで、あとから両方の機能を利用できます。">
      <IntentForm returnTo={safeReturnTo} />
    </OnboardingShell>
  );
}
