"use client";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { toast } from "sonner";
export function useNeed(id?: string) {
  const utils = trpc.useUtils();
  const [pagination, setPagination] = useState({
    limit: 50,
    cursor: undefined as string | undefined,
  });
  const listMine = trpc.need.listMine.useQuery();

  const getNeedById = trpc.need.getById.useQuery(
    { id: id! },
    { enabled: !!id },
  );
  const getAllNeeds = trpc.need.listAll.useQuery(
    {
      limit: pagination.limit,
      cursor: pagination.cursor,
    },
    {
      enabled: true,
    },
  );

  const createNeed = trpc.need.createNeed.useMutation({
    onSuccess: () => {
      utils.need.listMine.invalidate();
      if (id) utils.need.getById.invalidate({ id });
      toast.success("依頼が作成されました！");
    },
    onError: (err) => {
      const msg = err.data?.zodError
        ? "入力内容に誤りがあります"
        : err.message || "请求失败";
      toast.error(msg);
    },
  });
  const updateNeed = trpc.need.updateNeed.useMutation({
    onSuccess: () => {
      utils.need.listMine.invalidate();
      if (id) utils.need.getById.invalidate({ id }); // 刷新详情
      toast.success("内容を更新しました！");
    },
    // ... onError
  });
  const updateStatus = trpc.need.updateStatus.useMutation({
    onMutate: async (variables) => {
      await utils.need.listMine.cancel();
      const previousData = utils.need.listMine.getData();
      utils.need.listMine.setData(undefined, (old) => {
        return old?.map((need) =>
          need.id === variables.id
            ? { ...need, status: variables.status }
            : need,
        );
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      utils.need.listMine.setData(undefined, context?.previousData);
      toast.error("更新に失敗しました");
    },
    onSuccess: () => {
      toast.success("ステータスを更新しました");
    },
    onSettled() {
      utils.need.listMine.invalidate();
      if (id) utils.need.getById.invalidate({ id }); // 刷新详情
    },
  });
  const deleteNeed = trpc.need.deleteNeed.useMutation({
    onSuccess: async () => {
      toast.success("依頼を削除しました");
      utils.need.listMine.invalidate();
    },
    onError: () => {
      toast.error("削除に失敗しました");
    },
  });

  return {
    createNeed,
    listMine,
    getAllNeeds,
    setPagination,
    getNeedById,
    updateNeed,
    updateStatus,
    deleteNeed,
  };
}
