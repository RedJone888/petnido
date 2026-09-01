import { auth } from "@/modules/auth";
import { NeedV2List } from "./_components/NeedV2List";
import { NeedDashboardSignIn, NeedDraftPanel } from "./_components/NeedDraftList";

export default async function NeedsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return <NeedDashboardSignIn />;
  }

  const showDrafts = searchParams?.tab === "drafts";

  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      {showDrafts ? (
        <NeedDraftPanel />
      ) : (
        <NeedV2List
          user={session.user}
          mutable
        />
      )}
    </main>
  );
}
