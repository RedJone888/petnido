import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { createServerCaller } from "@/server/trpc/server-caller";

import { ProviderDetail } from "../provider-detail";

const getCachedProviderDetail = cache(async (providerId: string) => {
  const trpc = await createServerCaller();
  return trpc.marketplaceService.getProvider({ providerId }).catch(() => null);
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const providerId = decodeURIComponent(params.id);
  const detail = await getCachedProviderDetail(providerId);
  const subject = detail?.provider?.nickname ?? (await resolvePublicDetailSubject({ kind: "provider", publicId: providerId }));
  return publicDetailMetadata("provider", "en", `/providers/${encodeURIComponent(providerId)}`, subject);
}

export default async function ProviderDetailPage({ params }: { params: { id: string } }) {
  const providerId = decodeURIComponent(params.id);
  const initialData = await getCachedProviderDetail(providerId);
  if (!initialData) notFound();
  return <ProviderDetail providerId={providerId} initialData={initialData} />;
}
