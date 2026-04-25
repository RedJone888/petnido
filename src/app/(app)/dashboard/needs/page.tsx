import { auth } from "@/lib/auth";
import { listUserNeeds } from "@/lib/need";
import EmptyState from "../_components/EmptyState";
import { ClipboardList } from "lucide-react";
import NeedProfile from "./_components/NeedProfile";

export default async function NeedsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <>请先登录</>;
  }
  const needs = await listUserNeeds(session.user.id);

  if (!needs) {
    return (
      <EmptyState
        icon={<ClipboardList className="w-10 h-10" />}
        title="まだ依頼はありません"
        description="外出や出張のとき、大切な家族であるペットを安心して任せられるシッターさんを探してみませんか？"
        href="/dashboard/needs/new"
        btnLabel="新しい依頼を作成する"
      />
    );
  }

  return <NeedProfile needs={needs} user={session.user} />;
}
