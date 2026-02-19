import { t } from "../trpcInstance";
import { z } from "zod";

export const postsRouter = t.router({
  list: t.procedure
    .input(
      z.object({
        type: z.enum(["DEMAND", "OFFER"]).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        radiusKm: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = {};
      if (input?.type) where.type = input.type;
      const posts = await ctx.prisma.post.findMany({ where, take: 50 });
      return posts;
    }),
});
