import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PublicServiceDetail } from "@/app/(flow)/services/_components/public-service-detail";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export async function generateMetadata({ params }: { params: { lang: string; id: string } }): Promise<Metadata> {
  if (!isSupportedLanguage(params.lang)) return {};
  const decodedId = decodeURIComponent(params.id);
  const path = `/services/${encodeURIComponent(decodedId)}`;
  const subject = await resolvePublicDetailSubject({ kind: "service", publicId: decodedId });
  return subject ? publicDetailMetadata("service", params.lang, path, subject) : localizedPageMetadata("services", params.lang, path);
}

export default function LocalizedServiceDetailPage({ params }: { params: { lang: string; id: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  const decodedId = decodeURIComponent(params.id);
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <PublicServiceDetail publicId={decodedId} initialLanguage={params.lang} />;
}
