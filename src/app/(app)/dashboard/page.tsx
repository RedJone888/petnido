import { auth } from "@/modules/auth";
import { messages } from "@/i18n/messages";
import { createServerCaller } from "@/server/trpc/server-caller";

import { DashboardHomeContent } from "./_components/DashboardHomeContent";

export default async function DashboardHomePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <>{messages.en.core.dashboardHome.signInRequired}</>;
  }
  const trpc = await createServerCaller();
  const initialSummary = await trpc.dashboardSummary.getMine().catch(() => null);
  return <DashboardHomeContent user={session.user} initialSummary={initialSummary} />;
}
