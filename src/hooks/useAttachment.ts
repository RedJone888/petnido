import { trpc } from "@/utils/trpc";
export function useAttachment() {
  const createPresigned = trpc.attachment.createPresigned.useMutation({
    onSuccess: () => {},
  });
  return {
    createPresigned,
  };
}
