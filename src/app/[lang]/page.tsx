import { notFound } from "next/navigation";
import { MarketplaceHome } from "@/app/(home)/_components/marketplace-home";
import { isSupportedLanguage } from "@/domain/content/localized-page-metadata";

export default async function LocalizedHomePage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isSupportedLanguage(params.lang)) notFound();
  return <MarketplaceHome />;
}
