import { ServiceProfileDashboardClient } from "./service-profile-dashboard-client";

export default async function ServiceProfilePage(props: { searchParams?: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <ServiceProfileDashboardClient
      showDrafts={searchParams?.tab === "drafts"}
    />
  );
}
