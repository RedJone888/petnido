import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { PublicServiceDetail } from "@/app/(flow)/services/_components/public-service-detail";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";

import { createServerCaller } from "@/server/trpc/server-caller";

const getCachedServiceDetail = cache(async (publicId: string) => {
  const trpc = await createServerCaller();
  return trpc.marketplaceService.get({ publicId }).catch(() => null);
});

export async function generateMetadata({ params }: { params: { lang: string; id: string } }): Promise<Metadata> {
  if (!isSupportedLanguage(params.lang)) return {};
  const decodedId = decodeURIComponent(params.id);
  const path = `/services/${encodeURIComponent(decodedId)}`;
  const detail = await getCachedServiceDetail(decodedId);
  const subject = detail?.title ?? (await resolvePublicDetailSubject({ kind: "service", publicId: decodedId }));
  return subject ? publicDetailMetadata("service", params.lang, path, subject) : localizedPageMetadata("services", params.lang, path);
}

export default async function LocalizedServiceDetailPage({ params }: { params: { lang: string; id: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  const decodedId = decodeURIComponent(params.id);
  const initialData = await getCachedServiceDetail(decodedId);
  if (!initialData) notFound();
  return <PublicServiceDetail publicId={decodedId} initialLanguage={params.lang} initialData={initialData} />;
}
