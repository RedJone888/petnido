import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceComingSoon } from "@/components/marketplace/marketplace-coming-soon";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import type { Lang } from "@/domain/lang/types";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  return isSupportedLanguage(params.lang) ? localizedPageMetadata("providers", params.lang, "/providers") : {};
}

export default function LocalizedProvidersPage({ params }: { params: { lang: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  return (
    <MarketplaceComingSoon
      kind="providers"
      initialLanguage={params.lang as Lang}
    />
  );
}
