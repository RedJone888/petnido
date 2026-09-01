import { notFound } from "next/navigation";

import { isSupportedLanguage } from "@/domain/content/localized-page-metadata";
import { HomeVisitExampleDetail } from "@/modules/need-display/client/home-visit-example-detail";

export default function LocalizedHomeVisitExamplePage({ params }: { params: { lang: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  return <HomeVisitExampleDetail language={params.lang} />;
}
