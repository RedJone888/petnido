import { redirect } from "next/navigation";

import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

import { NeedMarketplace } from "./_components/need-marketplace";

export default function NeedsMarketplacePage() {
  if (!publicMarketplaceV2Enabled()) redirect("/public/needs");
  return <NeedMarketplace />;
}
