import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { ProviderDetail } from "@/app/(flow)/providers/provider-detail";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";

import { createServerCaller } from "@/server/trpc/server-caller";

const getCachedProviderDetail = cache(async (providerId: string) => {
  const trpc = await createServerCaller();
  return trpc.marketplaceService.getProvider({ providerId }).catch(() => null);
});

export async function generateMetadata(props: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) return {};
  const providerId = decodeURIComponent(params.id);
  const path = `/providers/${encodeURIComponent(providerId)}`;
  const detail = await getCachedProviderDetail(providerId);
  const subject = detail?.provider?.nickname ?? (await resolvePublicDetailSubject({ kind: "provider", publicId: providerId }));
  return subject ? publicDetailMetadata("provider", params.lang, path, subject) : localizedPageMetadata("providers", params.lang, path);
}

export default async function LocalizedProviderDetailPage(props: { params: Promise<{ lang: string; id: string }> }) {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) notFound();
  const providerId = decodeURIComponent(params.id);
  const initialData = await getCachedProviderDetail(providerId);
  if (!initialData) notFound();
  return <ProviderDetail providerId={providerId} initialLanguage={params.lang} initialData={initialData} />;
}
