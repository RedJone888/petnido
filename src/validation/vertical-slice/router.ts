import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import type { PrismaClient } from "../../../.generated/validation-client";
import {
  confirmValidationBooking,
  listPublicNeeds,
  publishHomeVisit,
  validationConfirmBookingSchema,
  validationPublishHomeVisitSchema,
} from "./service";

export type ValidationContext = { prisma: PrismaClient; userId: string | null; now: Date };
const t = initTRPC.context<ValidationContext>().create();

const requireUser = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const validationRouter = t.router({
  publicNeeds: t.procedure.input(z.object({}).strict()).query(({ ctx }) => listPublicNeeds(ctx.prisma, ctx.now)),
  publishHomeVisit: t.procedure
    .use(requireUser)
    .input(validationPublishHomeVisitSchema)
    .mutation(({ ctx, input }) => publishHomeVisit(ctx.prisma, ctx.userId, input)),
  confirmBooking: t.procedure
    .use(requireUser)
    .input(validationConfirmBookingSchema)
    .mutation(({ ctx, input }) => confirmValidationBooking(ctx.prisma, input)),
});
