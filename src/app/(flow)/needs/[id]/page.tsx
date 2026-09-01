import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { createServerCaller } from "@/server/trpc/server-caller";

import { PublicNeedDetail } from "../_components/public-need-detail";

const getCachedNeedDetail = cache(async (publicId: string) => {
  const trpc = await createServerCaller();
  return trpc.marketplaceNeed.get({ publicId }).catch(() => null);
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const publicId = decodeURIComponent(params.id);
  const detail = await getCachedNeedDetail(publicId);
  const subject = detail?.title ?? (await resolvePublicDetailSubject({ kind: "need", publicId }));
  return publicDetailMetadata("need", "en", `/needs/${encodeURIComponent(publicId)}`, subject);
}

export default async function NeedDetailPage({ params }: { params: { id: string } }) {
  const publicId = decodeURIComponent(params.id);
  const initialData = await getCachedNeedDetail(publicId);
  if (!initialData) notFound();
  return <PublicNeedDetail publicId={publicId} initialData={initialData} />;
}
