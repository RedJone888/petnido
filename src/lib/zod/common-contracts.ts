import { z } from "zod";

export const serviceModeSchema = z.enum(["HOME_VISIT", "BOARDING", "CUSTOM"]);

export const cursorPageInputSchema = z
  .object({
    cursor: z.string().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .strict();

export const pendingActionSchema = z
  .object({
    returnTo: z.string().startsWith("/").max(500),
    actionKind: z.enum(["FAVORITE", "CONSULT_NEED", "APPLY_NEED", "CONSULT_SERVICE", "BOOK_SERVICE"]),
    targetId: z.string().cuid(),
    draftId: z.string().cuid().optional(),
    expiresAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const idempotentCommandSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
  })
  .strict();
