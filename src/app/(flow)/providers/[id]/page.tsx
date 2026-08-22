import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

import { ProviderDetail } from "../provider-detail";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const providerId = decodeURIComponent(params.id);
  return publicDetailMetadata("provider", "en", `/providers/${encodeURIComponent(providerId)}`, await resolvePublicDetailSubject({ kind: "provider", publicId: providerId }));
}

export default function ProviderDetailPage({ params }: { params: { id: string } }) {
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <ProviderDetail providerId={decodeURIComponent(params.id)} />;
}
