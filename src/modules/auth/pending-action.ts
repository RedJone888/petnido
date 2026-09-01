import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { sanitizeReturnTo } from "./return-to";

export const pendingActionKindSchema = z.enum([
  "FAVORITE_NEED",
  "FAVORITE_SERVICE",
  "CONSULT_NEED",
  "CONSULT_SERVICE",
  "APPLY_NEED",
  "BOOK_SERVICE",
]);

export const pendingActionStartSchema = z
  .object({
    action: pendingActionKindSchema,
    targetId: z.string().min(1).max(128).refine(
      (value) => value.startsWith("v2:") && value.length > 3,
      "INVALID_PUBLIC_TARGET",
    ),
    returnTo: z.string().max(2048).optional().default("/"),
  })
  .strict();

const pendingActionPayloadSchema = z
  .object({
    version: z.literal(1),
    action: pendingActionKindSchema,
    targetId: z.string().min(1).max(128),
    returnTo: z.string().min(1).max(2048),
    nonce: z.string().uuid(),
    issuedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
  })
  .strict();

export type PendingActionKind = z.infer<typeof pendingActionKindSchema>;
export type PendingActionPayload = z.infer<typeof pendingActionPayloadSchema>;
const maxLifetimeSeconds = 30 * 60;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function pendingActionSecret() {
  const secret = process.env.PENDING_ACTION_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("PENDING_ACTION_SECRET_MISSING");
  return secret;
}

export function createPendingActionToken(
  input: { action: PendingActionKind; targetId: string; returnTo: string; ttlSeconds?: number },
  options?: { secret?: string; now?: Date; nonce?: string },
) {
  const now = Math.floor((options?.now ?? new Date()).getTime() / 1000);
  const ttlSeconds = Math.min(Math.max(input.ttlSeconds ?? 15 * 60, 60), maxLifetimeSeconds);
  const payload: PendingActionPayload = {
    version: 1,
    action: input.action,
    targetId: input.targetId,
    returnTo: sanitizeReturnTo(input.returnTo, "/"),
    nonce: options?.nonce ?? randomUUID(),
    issuedAt: now,
    expiresAt: now + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, options?.secret ?? pendingActionSecret())}`;
}

export function verifyPendingActionToken(
  token: string,
  options?: { secret?: string; now?: Date },
): PendingActionPayload | null {
  const [encoded, providedSignature, extra] = token.split(".");
  if (!encoded || !providedSignature || extra) return null;
  const expected = Buffer.from(signature(encoded, options?.secret ?? pendingActionSecret()));
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const parsed = pendingActionPayloadSchema.parse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")),
    );
    const now = Math.floor((options?.now ?? new Date()).getTime() / 1000);
    if (
      parsed.expiresAt <= now ||
      parsed.issuedAt > now + 60 ||
      parsed.expiresAt - parsed.issuedAt > maxLifetimeSeconds ||
      sanitizeReturnTo(parsed.returnTo, "/") !== parsed.returnTo
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function pendingActionUrl(token: string) {
  return `/auth/pending-action?token=${encodeURIComponent(token)}`;
}
