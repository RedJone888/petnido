import type { Metadata } from "next";

import { MarketplaceComingSoon } from "@/components/marketplace/marketplace-coming-soon";

export const metadata: Metadata = {
  title: "Knowledge · In development | PetNido",
  robots: { index: false, follow: true },
  description: "This section is under development.",
};

export default function KnowledgePage() {
  return <MarketplaceComingSoon kind="knowledge" />;
}
