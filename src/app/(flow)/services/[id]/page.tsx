import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

import { PublicServiceDetail } from "../_components/public-service-detail";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const publicId = decodeURIComponent(params.id);
  return publicDetailMetadata("service", "en", `/services/${encodeURIComponent(publicId)}`, await resolvePublicDetailSubject({ kind: "service", publicId }));
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <PublicServiceDetail publicId={decodeURIComponent(params.id)} />;
}
