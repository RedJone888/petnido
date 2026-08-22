import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProviderMarketplace } from "@/app/(flow)/providers/provider-marketplace";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  return isSupportedLanguage(params.lang) ? localizedPageMetadata("providers", params.lang, "/providers") : {};
}

export default function LocalizedProvidersPage({ params }: { params: { lang: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <ProviderMarketplace initialLanguage={params.lang} />;
}
