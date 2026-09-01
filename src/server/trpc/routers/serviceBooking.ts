import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { bookingWindowSchema, buildServiceBookingCalendar } from "@/domain/booking/service-booking";
import { clientMessageIdSchema, conversationContextTargetSchema, messageBodySchema } from "@/domain/messaging/conversation";
import { BookingCommandError, cancelServiceBooking, confirmServiceBooking, createServiceBooking, declineServiceBooking } from "@/server/domains/booking/service-booking-v2";
import { protectedProcedure, router } from "@/server/trpc/trpc";

function commandError(error: unknown): never {
  if (error instanceof BookingCommandError) {
    const code = error.code === "RESOURCE_NOT_FOUND" ? "NOT_FOUND" : error.code === "FORBIDDEN_RESOURCE_ACTION" ? "FORBIDDEN" : "CONFLICT";
    throw new TRPCError({ code, message: error.code, cause: error });
  }
  throw error;
}
const idInput = z.object({ bookingId: z.string().min(1).max(128) }).strict();

export const serviceBookingRouter = router({
  create: protectedProcedure.input(z.object({
    target: z.object({ kind: z.literal("SERVICE"), publicId: z.string().min(1).max(128) }).strict(),
    startsAt: z.coerce.date(), endsAt: z.coerce.date(), pets: z.array(z.object({ petId: z.string().min(1).max(128), quantity: z.number().int().min(1).max(100) }).strict()).min(1).max(20),
    body: messageBodySchema, idempotencyKey: clientMessageIdSchema,
  }).strict()).mutation(async ({ ctx, input }) => {
    const window = bookingWindowSchema.parse({ startsAt: input.startsAt, endsAt: input.endsAt, pets: input.pets });
    try { return await createServiceBooking(ctx.prisma, { actorId: ctx.session.user.id, target: conversationContextTargetSchema.parse(input.target), ...window, body: input.body, idempotencyKey: input.idempotencyKey }); }
    catch (error) { commandError(error); }
  }),
  confirm: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    try { return await confirmServiceBooking(ctx.prisma, { providerId: ctx.session.user.id, bookingId: input.bookingId }); }
    catch (error) { commandError(error); }
  }),
  decline: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    try { return await declineServiceBooking(ctx.prisma, { providerId: ctx.session.user.id, bookingId: input.bookingId }); }
    catch (error) { commandError(error); }
  }),
  cancel: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    try { return await cancelServiceBooking(ctx.prisma, { actorId: ctx.session.user.id, bookingId: input.bookingId }); }
    catch (error) { commandError(error); }
  }),
  listMine: protectedProcedure.query(({ ctx }) => ctx.prisma.serviceBookingV2.findMany({
    where: { customerId: ctx.session.user.id }, orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    include: { pets: true, provider: { select: { id: true, name: true, image: true } } },
  })),
  listReceived: protectedProcedure.query(({ ctx }) => ctx.prisma.serviceBookingV2.findMany({
    where: { providerId: ctx.session.user.id }, orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    include: { pets: true, customer: { select: { id: true, name: true, image: true } } },
  })),
  calendar: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1).max(128), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) }).strict())
    .query(async ({ ctx, input }) => {
      const service = await ctx.prisma.serviceV2.findFirst({
        where: { id: input.serviceId, archivedAt: null, serviceProfile: { userId: ctx.session.user.id } },
        select: { id: true, title: true, mode: true, timeZone: true, maxPetCapacity: true },
      });
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      const monthStart = new Date(`${input.month}-01T00:00:00.000Z`);
      const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 2));
      const bookings = await ctx.prisma.serviceBookingV2.findMany({
        where: {
          serviceSource: "V2", serviceId: service.id, providerId: ctx.session.user.id, state: "CONFIRMED",
          startsAt: { lt: monthEnd }, endsAt: { gt: new Date(monthStart.getTime() - 2 * 86_400_000) },
        },
        select: { startsAt: true, endsAt: true, petCount: true },
      });
      return {
        service: { id: service.id, title: service.title, mode: service.mode, timeZone: service.timeZone, maxPetCapacity: service.mode === "BOARDING" ? service.maxPetCapacity : null },
        days: buildServiceBookingCalendar({ month: input.month, timeZone: service.timeZone, mode: service.mode, maxPetCapacity: service.maxPetCapacity, bookings }),
      };
    }),
});
