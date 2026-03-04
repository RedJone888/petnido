"use client";
import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/dashboard/EmptyState";
import { useNeed } from "@/hooks/useNeed";
import LoadingPage from "@/components/ui/LoadingPage";
import NeedProfile from "./NeedProfile";

export default function NeedsPage() {
  const { listMine } = useNeed();
  const needs = listMine.data;
  const router = useRouter();

  if (listMine.isLoading) {
    return <LoadingPage title="読み込み中..." />;
  }
  if (!needs) {
    return (
      <EmptyState
        icon={<ClipboardList className="w-10 h-10" />}
        title="まだ依頼はありません"
        description="外出や出張のとき、大切な家族であるペットを安心して任せられるシッターさんを探してみませんか？"
        actionLabel="新しい依頼を作成する"
        onAction={() => router.push("./new")}
      />
    );
  }

  return <NeedProfile needs={needs} />;
}
