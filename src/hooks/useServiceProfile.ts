import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
export function useServiceProfile() {
  const utils = trpc.useUtils();
  // 与数据库交互
  const getServiceProfile = trpc.serviceProfile.getMine.useQuery();
  const getLocationAndCurrency =
    trpc.serviceProfile.getLocationAndCurrency.useQuery();
  const toggleSitter = trpc.serviceProfile.toggleSitterStatus.useMutation({
    onMutate: async (variables) => {
      await utils.serviceProfile.getMine.cancel();
      const previousData = utils.serviceProfile.getMine.getData();
      utils.serviceProfile.getMine.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          serviceProfile: old.serviceProfile
            ? { ...old.serviceProfile, isAccepting: variables.active }
            : old.serviceProfile,
        };
      });
      return { previousData };
    },
    onSuccess: (data, variables) => {
      toast.success(
        variables.active ? "受付を開始しました" : "受付を停止しました",
      );
    },
    onError: (err, variables, context) => {
      utils.serviceProfile.getMine.setData(undefined, context?.previousData);
      toast.error("更新に失敗しました");
    },
    onSettled: () => {
      utils.serviceProfile.getMine.invalidate();
    },
  });

  return {
    getServiceProfile,
    getLocationAndCurrency,
    userProfile: getServiceProfile.data,
    isGetServiceProfileLoading: getServiceProfile.isLoading,
    refetchServiceProfile: getServiceProfile.refetch,
    toggleSitter,
  };
}
