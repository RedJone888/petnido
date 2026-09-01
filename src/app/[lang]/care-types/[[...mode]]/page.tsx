import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CareTypeDetail, CareTypesHub, type CareMode } from "@/app/(home)/_components/care-type-pages";
import { isSupportedLanguage, localizedPageMetadata, type LocalizedPage } from "@/domain/content/localized-page-metadata";

const modePages: Record<CareMode, LocalizedPage> = {
  "home-visits": "care-home-visits",
  boarding: "care-boarding",
  custom: "care-custom",
};

function selectedMode(value?: string[]): CareMode | null | "INVALID" {
  if (!value?.length) return null;
  if (value.length !== 1 || !(value[0] in modePages)) return "INVALID";
  return value[0] as CareMode;
}

export function generateMetadata({ params }: { params: { lang: string; mode?: string[] } }): Metadata {
  if (!isSupportedLanguage(params.lang)) return {};
  const mode = selectedMode(params.mode);
  if (mode === "INVALID") return {};
  const path = mode ? `/care-types/${mode}` : "/care-types";
  return localizedPageMetadata(mode ? modePages[mode] : "care-types", params.lang, path);
}

export default function LocalizedCareTypesPage({ params }: { params: { lang: string; mode?: string[] } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  const mode = selectedMode(params.mode);
  if (mode === "INVALID") notFound();
  return mode
    ? <CareTypeDetail modeKey={mode} language={params.lang} />
    : <CareTypesHub language={params.lang} />;
}
