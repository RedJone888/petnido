"use client";
import { needApiToForm } from "@/domain/need/mapper";
import { NeedForm } from "../../NeedForm";
import { NeedCreateInput } from "@/lib/zod/needs";
import { useNeed } from "@/hooks/useNeed";
import LoadingPage from "@/components/ui/LoadingPage";

export default function EditNeedPage({ params }: { params: { id: string } }) {
  const { getNeedById, updateNeed } = useNeed(params.id);
  const needData = getNeedById.data;
  const handleSubmit = async (data: NeedCreateInput) => {
    console.log("EditNeedPage", data);
    try {
      await updateNeed.mutateAsync({ id: params.id, ...data });
    } catch (error) {
      console.error("提交失败：", error);
    }
  };
  if (getNeedById.isLoading) {
    return <LoadingPage title="読み込み中..." />;
  }
  if (!needData) {
    return (
      <div className="p-10 text-center text-gray-500">
        依頼が見つかりませんでした。
      </div>
    );
  }
  return (
    <NeedForm
      initialData={needApiToForm(needData)}
      onSubmit={handleSubmit}
      isLoading={updateNeed.isLoading}
    />
  );
}
