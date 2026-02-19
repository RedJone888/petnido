import { useConfirmStore } from "@/store/useConfirmStore";
export const useConfirm = () => {
  const openConfirm = useConfirmStore((state) => state.openConfirm);
  return openConfirm;
};
