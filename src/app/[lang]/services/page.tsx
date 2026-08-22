import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ServiceMarketplace } from "@/app/(flow)/services/_components/service-marketplace";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  return isSupportedLanguage(params.lang) ? localizedPageMetadata("services", params.lang, "/services") : {};
}

export default function LocalizedServicesPage({ params }: { params: { lang: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  if (!publicMarketplaceV2Enabled()) redirect("/public/sitters");
  return <ServiceMarketplace initialLanguage={params.lang} />;
}
