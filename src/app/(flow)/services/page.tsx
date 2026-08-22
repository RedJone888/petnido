import { redirect } from "next/navigation";

import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

import { ServiceMarketplace } from "./_components/service-marketplace";

export default function ServicesPage() {
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <ServiceMarketplace />;
}
