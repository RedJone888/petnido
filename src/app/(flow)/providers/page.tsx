import { redirect } from "next/navigation";

import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

import { ProviderMarketplace } from "./provider-marketplace";

export default function ProvidersPage() {
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <ProviderMarketplace />;
}
