import { auth } from "@/modules/auth";
import { messages } from "@/i18n/messages";

import { DashboardHomeContent } from "./_components/DashboardHomeContent";

export default async function DashboardHomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <>{messages.en.core.dashboardHome.signInRequired}</>;
  }
  return <DashboardHomeContent user={session.user} />;
}
