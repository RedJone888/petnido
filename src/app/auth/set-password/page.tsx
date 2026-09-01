import { redirect } from "next/navigation";

import { SetPasswordPageClient } from "@/modules/auth/client/pages/set-password-page";
import { getAccountOverview } from "@/modules/auth/server/account-service";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function SetPasswordPage() {
  const { userId, prisma } = await getServerUserContext();
  if (!userId) redirect("/auth/sign-in?returnTo=%2Fauth%2Fset-password");

  const account = await getAccountOverview(prisma, userId);
  if (!account.email) redirect("/dashboard/settings/security");

  return <SetPasswordPageClient email={account.email} hasPassword={account.hasPassword} />;
}
