import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { KnowledgeLibrary } from "@/app/(home)/knowledge/knowledge-library";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  if (!isSupportedLanguage(params.lang)) return {};
  return localizedPageMetadata("knowledge", params.lang, "/knowledge");
}

export default function LocalizedKnowledgePage({ params }: { params: { lang: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  return <KnowledgeLibrary language={params.lang} />;
}
