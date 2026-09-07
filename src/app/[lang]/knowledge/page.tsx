import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceComingSoon } from "@/components/marketplace/marketplace-coming-soon";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) return {};
  return { ...localizedPageMetadata("knowledge", params.lang, "/knowledge"), robots: { index: false, follow: true } };
}

export default async function LocalizedKnowledgePage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) notFound();
  return <MarketplaceComingSoon kind="knowledge" initialLanguage={params.lang} />;
}
