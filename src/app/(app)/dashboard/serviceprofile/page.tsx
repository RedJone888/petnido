import { ServiceProfileDashboardClient } from "./service-profile-dashboard-client";

export default function ServiceProfilePage({ searchParams }: { searchParams?: { tab?: string } }) {
  return (
    <ServiceProfileDashboardClient
      showDrafts={searchParams?.tab === "drafts"}
    />
  );
}
