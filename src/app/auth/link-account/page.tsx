import LinkAccountPageClient from "@/modules/auth/client/pages/link-account-page";

export default function LinkAccountPage({
  searchParams,
}: {
  searchParams: { pending?: string; connectError?: string; connectProvider?: string };
}) {
  return (
    <LinkAccountPageClient
      pendingId={searchParams.pending ?? ""}
      connectError={searchParams.connectError ?? ""}
      connectProvider={searchParams.connectProvider === "line" ? "line" : "google"}
    />
  );
}
