import { z } from "zod";

const commandBase = {
  idempotencyKey: z.string().uuid(),
  message: z.string().trim().min(1).max(5000),
};

export const applyToNeedSchema = z
  .object({ ...commandBase, needId: z.string().cuid(), offeredAmountMinor: z.number().int().nonnegative().optional() })
  .strict();

export const requestBookingSchema = z
  .object({
    ...commandBase,
    serviceId: z.string().cuid(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    petIds: z.array(z.string().cuid()).min(1).max(20),
  })
  .strict();

export const confirmApplicationSchema = z
  .object({ applicationId: z.string().cuid(), idempotencyKey: z.string().uuid() })
  .strict();

export const confirmBookingSchema = z
  .object({ bookingId: z.string().cuid(), idempotencyKey: z.string().uuid() })
  .strict();

export const sendMessageSchema = z
  .object({
    conversationId: z.string().cuid(),
    clientMessageId: z.string().uuid(),
    content: z.string().trim().min(1).max(5000),
  })
  .strict();
