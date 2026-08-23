import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PublicNeedDetail } from "@/app/(flow)/needs/_components/public-need-detail";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export async function generateMetadata({ params }: { params: { lang: string; id: string } }): Promise<Metadata> {
  if (!isSupportedLanguage(params.lang)) return {};
  const decodedId = decodeURIComponent(params.id);
  const path = `/needs/${encodeURIComponent(decodedId)}`;
  const subject = await resolvePublicDetailSubject({ kind: "need", publicId: decodedId }, params.lang);
  return subject ? publicDetailMetadata("need", params.lang, path, subject) : localizedPageMetadata("needs", params.lang, path);
}

export default function LocalizedNeedDetailPage({ params }: { params: { lang: string; id: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  const decodedId = decodeURIComponent(params.id);
  if (!publicMarketplaceV2Enabled()) redirect(`/public/needs/${encodeURIComponent(decodedId)}`);
  return <PublicNeedDetail publicId={decodedId} initialLanguage={params.lang} />;
}
