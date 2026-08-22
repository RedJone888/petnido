import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HowItWorksHub, PostingGuide } from "@/app/(home)/_components/guide-pages";
import { isSupportedLanguage, localizedPageMetadata } from "@/domain/content/localized-page-metadata";

type Guide = "needs" | "services";

function selectedGuide(value?: string[]): Guide | null | "INVALID" {
  if (!value?.length) return null;
  if (value.length !== 1 || (value[0] !== "needs" && value[0] !== "services")) return "INVALID";
  return value[0];
}

export function generateMetadata({ params }: { params: { lang: string; guide?: string[] } }): Metadata {
  if (!isSupportedLanguage(params.lang)) return {};
  const guide = selectedGuide(params.guide);
  if (guide === "INVALID") return {};
  const page = guide === "needs" ? "how-needs" : guide === "services" ? "how-services" : "how-it-works";
  const path = guide ? `/how-it-works/${guide}` : "/how-it-works";
  return localizedPageMetadata(page, params.lang, path);
}

export default function LocalizedHowItWorksPage({ params }: { params: { lang: string; guide?: string[] } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  const guide = selectedGuide(params.guide);
  if (guide === "INVALID") notFound();
  return guide
    ? <PostingGuide kind={guide} language={params.lang} />
    : <HowItWorksHub language={params.lang} />;
}
