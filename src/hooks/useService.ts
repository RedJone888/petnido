import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
export function useService(id?: string) {
  const utils = trpc.useUtils();
  const createService = trpc.service.createService.useMutation({
    onSuccess: async () => {
      utils.serviceProfile.getMine.invalidate();
      if (id) utils.service.getById.invalidate({ id });
      toast.success("サービスが作成されました 🐾");
    },
    onError: (err) => {
      if (err.data?.zodError) {
        toast.error("作成中にエラーが発生しました");
      }
    },
  });
  const getServiceById = trpc.service.getById.useQuery(
    { id: id! },
    { enabled: !!id },
  );
  const updateService = trpc.service.updateService.useMutation({
    onSuccess: async () => {
      utils.serviceProfile.getMine.invalidate();
      if (id) utils.service.getById.invalidate({ id });
      toast.success("サービスを更新しました 🐾");
    },
  });
  const executeCommand = trpc.service.executeCommand.useMutation({
    // 1. 在调用接口的一瞬间触发
    onMutate: async ({ id: serviceId, command }) => {
      const isActive = command === "RESUME";
      // 撤销正在进行的刷新，防止覆盖我们的乐观更新
      await utils.serviceProfile.getMine.cancel();
      // 保存当前缓存的快照，以便失败时回滚
      const previousData = utils.serviceProfile.getMine.getData();
      // 2. 模拟后端成功，手动修改本地缓存
      utils.serviceProfile.getMine.setData(undefined, (old) => {
        if (!old || !old.serviceProfile) return old;
        return {
          ...old,
          serviceProfile: {
            ...old.serviceProfile,
            services: old.serviceProfile?.services.map((s) =>
              s.id === serviceId ? { ...s, isActive } : s,
            ),
          },
        };
      });
      // 返回上下文，包含回滚用的数据
      return { previousData };
    },
    onSuccess: async () => {
      toast.success("サービスを更新しました 🐾");
    },
    onError(error, variables, context) {
      utils.serviceProfile.getMine.setData(undefined, context?.previousData);
      toast.error("更新に失敗しました");
    },
    onSettled: () => {
      utils.serviceProfile.getMine.invalidate();
      if (id) utils.service.getById.invalidate({ id });
    },
  });
  const deleteService = trpc.service.deleteService.useMutation({
    onSuccess: async () => {
      toast.success("サービスを削除しました");
      utils.serviceProfile.getMine.invalidate();
    },
    onError: () => {
      toast.error("削除に失敗しました");
    },
  });
  return {
    createService,
    updateService,
    executeCommand,
    deleteService,
    getServiceById,
  };
}
