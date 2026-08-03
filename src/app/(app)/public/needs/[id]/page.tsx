import NeedDetailPage from "../_components/NeedDetailPage";
import { getNeedById } from "@/lib/need";

export default async function NeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const needData = await getNeedById(id);
  return (
    <div className="h-full overflow-y-auto">
      <NeedDetailPage initialNeed={needData} />
    </div>
  );
}
