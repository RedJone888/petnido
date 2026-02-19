"use client";
import { useNeed } from "@/hooks/useNeed";
import { NeedForm } from "../NeedForm";
import { NeedCreateInput } from "@/lib/zod/needs";
export default function NewNeedPage() {
  const { createNeed } = useNeed();
  const handleSubmit = async (data: NeedCreateInput) => {
    try {
      await createNeed.mutateAsync(data);
    } catch (error) {
      console.error("提交失败：", error);
    }
  };

  return <NeedForm onSubmit={handleSubmit} isLoading={createNeed.isLoading} />;
}
