import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { NeedMarketplace } from "@/app/(flow)/needs/_components/need-marketplace";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  return isSupportedLanguage(params.lang) ? localizedPageMetadata("needs", params.lang, "/needs") : {};
}

export default function LocalizedNeedsPage({ params }: { params: { lang: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  if (!publicMarketplaceV2Enabled()) redirect("/public/needs");
  return <NeedMarketplace initialLanguage={params.lang} />;
}
