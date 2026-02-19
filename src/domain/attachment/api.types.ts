import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/trpc";
type RouterOutputs = inferRouterOutputs<AppRouter>;
export type AttachmentPresignedFromApi =
  RouterOutputs["attachment"]["createPresigned"];
