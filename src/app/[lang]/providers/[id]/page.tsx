import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProviderDetail } from "@/app/(flow)/providers/provider-detail";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export async function generateMetadata({ params }: { params: { lang: string; id: string } }): Promise<Metadata> {
  if (!isSupportedLanguage(params.lang)) return {};
  const path = `/providers/${encodeURIComponent(params.id)}`;
  const subject = await resolvePublicDetailSubject({ kind: "provider", publicId: params.id });
  return subject ? publicDetailMetadata("provider", params.lang, path, subject) : localizedPageMetadata("providers", params.lang, path);
}

export default function LocalizedProviderDetailPage({ params }: { params: { lang: string; id: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <ProviderDetail providerId={params.id} initialLanguage={params.lang} />;
}
