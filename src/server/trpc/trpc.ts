//负责initTRPC+error formatter+router/procedure导出
import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import type { TRPCContext } from "@/server/trpc/context";
import { formatAppError } from "@/server/trpc/app-error";
const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error, ctx }) {
    const appError = formatAppError(error, ctx?.requestId ?? "unknown");
    return {
      ...shape,
      message: appError.code,
      data: {
        ...shape.data,
        appError,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user || !ctx.session.user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
    // "ログインが必要です"
  }
  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
        user: {
          ...ctx.session.user,
          id: ctx.session.user.id,
        },
      },
    },
  });
});
