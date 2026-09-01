import { appRouter } from "@/server/trpc";
import { createContext } from "@/server/trpc/context";

export async function createServerCaller() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}

export function serializeForClient<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}
