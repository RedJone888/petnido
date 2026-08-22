import { ServiceProfileDashboardClient } from "./service-profile-dashboard-client";
import {
  publishingV2ReadEnabled,
  publishingV2WriteEnabled,
} from "@/server/feature-flags/publishing-v2";

export default function ServiceProfilePage() {
  return (
    <ServiceProfileDashboardClient
      publishingV2Enabled={publishingV2ReadEnabled()}
      publishingV2Mutable={publishingV2WriteEnabled()}
    />
  );
}
