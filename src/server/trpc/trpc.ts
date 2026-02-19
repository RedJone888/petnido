//负责initTRPC+error formatter+router/procedure导出
import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import type { TRPCContext } from "@/server/trpc/context";
const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new Error("ログインが必要です");
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});
