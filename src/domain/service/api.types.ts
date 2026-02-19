import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/trpc";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type GetMineOutput = RouterOutputs["serviceProfile"]["getMine"];
export type ProfileApi = NonNullable<GetMineOutput>["profile"];
export type ServiceProfileApi = NonNullable<
  NonNullable<GetMineOutput>["serviceProfile"]
>;
export type ServiceApi = NonNullable<ServiceProfileApi>["services"][number];
export type PhotoApi = NonNullable<ServiceApi>["photos"][number];
export type PriceRuleApi = NonNullable<ServiceApi>["priceRules"][number];
