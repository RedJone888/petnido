import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { publicDetailMetadata } from "@/domain/content/public-detail-metadata";
import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { createServerCaller } from "@/server/trpc/server-caller";

import { PublicServiceDetail } from "../_components/public-service-detail";

const getCachedServiceDetail = cache(async (publicId: string) => {
  const trpc = await createServerCaller();
  return trpc.marketplaceService.get({ publicId }).catch(() => null);
});

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const publicId = decodeURIComponent(params.id);
  const detail = await getCachedServiceDetail(publicId);
  const subject = detail?.title ?? (await resolvePublicDetailSubject({ kind: "service", publicId }));
  return publicDetailMetadata("service", "en", `/services/${encodeURIComponent(publicId)}`, subject);
}

export default async function ServiceDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const publicId = decodeURIComponent(params.id);
  const initialData = await getCachedServiceDetail(publicId);
  if (!initialData) notFound();
  return <PublicServiceDetail publicId={publicId} initialData={initialData} />;
}
