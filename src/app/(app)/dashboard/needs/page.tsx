import { auth } from "@/modules/auth";
import { NeedV2List } from "./_components/NeedV2List";
import { messages } from "@/i18n/messages";
import { publishingV2WriteEnabled } from "@/server/feature-flags/publishing-v2";

export default async function NeedsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className="h-full overflow-y-auto p-6">
        {messages.en.core.dashboardNeeds.signIn}
      </main>
    );
  }

  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <NeedV2List
        user={session.user}
        mutable={publishingV2WriteEnabled()}
      />
    </main>
  );
}
