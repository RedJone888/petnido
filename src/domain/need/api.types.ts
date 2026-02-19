import { AppRouter } from "@/server/trpc";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type GetNeedOutput = RouterOutputs["need"]["getById"];
export type ListMineOutput = RouterOutputs["need"]["listMine"];
export type ListAllOutput = RouterOutputs["need"]["listAll"];
export type MyNeedApi = NonNullable<ListMineOutput>[number];
export type AllNeedApi = NonNullable<ListAllOutput>[number];
export type OneNeedApi = NonNullable<GetNeedOutput>;
export type NeedPetApi = NonNullable<OneNeedApi>["needPets"][number];
