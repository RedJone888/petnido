import { redirect } from "next/navigation";
import { Modal } from "@/components/Modal";
import NeedDetailPage from "../../_components/NeedDetailPage";
import { getNeedById } from "@/lib/need";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";

export default async function LegacyNeedModalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (publicMarketplaceV2Enabled()) redirect(`/needs/${encodeURIComponent(params.id)}`);
  const needData = await getNeedById(params.id);
  if (!needData) return <Modal><div className="p-8">Request not found</div></Modal>;
  return <Modal><NeedDetailPage initialNeed={needData} /></Modal>;
}
