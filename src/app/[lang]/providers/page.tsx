import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceComingSoon } from "@/components/marketplace/marketplace-coming-soon";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import type { Lang } from "@/domain/lang/types";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  return isSupportedLanguage(params.lang) ? localizedPageMetadata("providers", params.lang, "/providers") : {};
}

export default async function LocalizedProvidersPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) notFound();
  return (
    <MarketplaceComingSoon
      kind="providers"
      initialLanguage={params.lang as Lang}
    />
  );
}
