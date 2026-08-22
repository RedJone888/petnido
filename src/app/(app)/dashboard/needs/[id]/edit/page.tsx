"use client";
import { needApiToForm } from "@/domain/need/mapper";
import { NeedForm } from "../../_components/form";
import { NeedCreateInput } from "@/lib/zod/needs";
import { useNeed } from "@/hooks/useNeed";
import LoadingPage from "@/components/shared/loading-page";
import { useLanguage } from "@/components/providers/language-provider";

export default function NeedEditPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();
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
    return <LoadingPage title={t.core.common.loading} />;
  }
  if (!needData) {
    return (
      <div className="p-10 text-center text-gray-500">
        {t.core.dashboardNeedDetail.unavailable}
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
