import LinkAccountPageClient from "@/modules/auth/client/pages/link-account-page";

export default async function LinkAccountPage(
  props: {
    searchParams: Promise<{ pending?: string; connectError?: string; connectProvider?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return (
    <LinkAccountPageClient
      pendingId={searchParams.pending ?? ""}
      connectError={searchParams.connectError ?? ""}
      connectProvider={searchParams.connectProvider === "line" ? "line" : "google"}
    />
  );
}
