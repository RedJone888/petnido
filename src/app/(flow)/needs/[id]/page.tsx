import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

import { PublicNeedDetail } from "../_components/public-need-detail";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const publicId = decodeURIComponent(params.id);
  return publicDetailMetadata("need", "en", `/needs/${encodeURIComponent(publicId)}`, await resolvePublicDetailSubject({ kind: "need", publicId }));
}

export default function NeedDetailPage({ params }: { params: { id: string } }) {
  if (!publicMarketplaceV2Enabled()) {
    const legacyId = params.id.startsWith("legacy:") ? params.id.slice(7) : params.id;
    redirect(`/public/needs/${encodeURIComponent(legacyId)}`);
  }
  return <PublicNeedDetail publicId={decodeURIComponent(params.id)} />;
}
