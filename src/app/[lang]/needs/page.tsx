import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { NeedMarketplace } from "@/app/(flow)/needs/_components/need-marketplace";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";

import { createServerCaller } from "@/server/trpc/server-caller";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  return isSupportedLanguage(params.lang) ? localizedPageMetadata("needs", params.lang, "/needs") : {};
}

export default async function LocalizedNeedsPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) notFound();
  const trpc = await createServerCaller();
  const initialData = await trpc.marketplaceNeed.list({ filter: {}, limit: 20 }).catch(() => null);
  return <NeedMarketplace initialLanguage={params.lang as any} initialData={initialData} />;
}
