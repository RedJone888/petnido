import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { PublicNeedDetail } from "@/app/(flow)/needs/_components/public-need-detail";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";
import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";

import { createServerCaller } from "@/server/trpc/server-caller";

const getCachedNeedDetail = cache(async (publicId: string) => {
  const trpc = await createServerCaller();
  return trpc.marketplaceNeed.get({ publicId }).catch(() => null);
});

export async function generateMetadata({ params }: { params: { lang: string; id: string } }): Promise<Metadata> {
  if (!isSupportedLanguage(params.lang)) return {};
  const decodedId = decodeURIComponent(params.id);
  const path = `/needs/${encodeURIComponent(decodedId)}`;
  const detail = await getCachedNeedDetail(decodedId);
  const subject = detail?.title ?? (await resolvePublicDetailSubject({ kind: "need", publicId: decodedId }, params.lang));
  return subject ? publicDetailMetadata("need", params.lang, path, subject) : localizedPageMetadata("needs", params.lang, path);
}

export default async function LocalizedNeedDetailPage({ params }: { params: { lang: string; id: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  const decodedId = decodeURIComponent(params.id);
  const initialData = await getCachedNeedDetail(decodedId);
  if (!initialData) notFound();
  return <PublicNeedDetail publicId={decodedId} initialLanguage={params.lang} initialData={initialData} />;
}
