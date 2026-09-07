import { notFound } from "next/navigation";

import { isSupportedLanguage } from "@/domain/content/localized-page-metadata";
import { HomeVisitExampleDetail } from "@/modules/need-display/client/home-visit-example-detail";

export default async function LocalizedHomeVisitExamplePage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) notFound();
  return <HomeVisitExampleDetail language={params.lang} />;
}
