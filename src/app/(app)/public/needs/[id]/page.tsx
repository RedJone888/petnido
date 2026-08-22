import { redirect } from "next/navigation";
import NeedDetailPage from "../_components/NeedDetailPage";
import { getNeedById } from "@/lib/need";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export default async function LegacyNeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (publicMarketplaceV2Enabled()) redirect(`/needs/${encodeURIComponent(id)}`);
  const needData = await getNeedById(id);
  return <div className="h-full overflow-y-auto"><NeedDetailPage initialNeed={needData} /></div>;
}
