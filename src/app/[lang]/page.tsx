import { notFound } from "next/navigation";
import { MarketplaceHome } from "@/app/(home)/_components/marketplace-home";
import { isSupportedLanguage } from "@/domain/content/localized-page-metadata";

export default function LocalizedHomePage({ params }: { params: { lang: string } }) {
  if (!isSupportedLanguage(params.lang)) notFound();
  return <MarketplaceHome />;
}
