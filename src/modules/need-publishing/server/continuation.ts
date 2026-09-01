import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { sanitizeReturnTo } from "@/modules/auth/return-to";

const continuationPayloadSchema = z
  .object({
    version: z.literal(1),
    purpose: z.literal("POST_NEED"),
    nonce: z.string().uuid(),
    issuedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
  })
  .strict();

export type NeedPublishingContinuation = z.infer<
  typeof continuationPayloadSchema
>;

const maxLifetimeSeconds = 30 * 60;

function continuationSecret(explicit?: string) {
  const secret =
    explicit ??
    process.env.NEED_PUBLISHING_CONTINUATION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("NEED_PUBLISHING_CONTINUATION_SECRET_MISSING");
  }
  return secret;
}

function signature(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function createNeedPublishingContinuationToken(options?: {
  secret?: string;
  now?: Date;
  nonce?: string;
  ttlSeconds?: number;
}) {
  const now = Math.floor((options?.now ?? new Date()).getTime() / 1000);
  const ttlSeconds = Math.min(
    Math.max(options?.ttlSeconds ?? 15 * 60, 60),
    maxLifetimeSeconds,
  );
  const payload: NeedPublishingContinuation = {
    version: 1,
    purpose: "POST_NEED",
    nonce: options?.nonce ?? randomUUID(),
    issuedAt: now,
    expiresAt: now + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(
    encoded,
    continuationSecret(options?.secret),
  )}`;
}

export function verifyNeedPublishingContinuationToken(
  token: string,
  options?: { secret?: string; now?: Date },
): NeedPublishingContinuation | null {
  const [encoded, providedSignature, extra] = token.split(".");
  if (!encoded || !providedSignature || extra) return null;

  try {
    const expected = Buffer.from(
      signature(encoded, continuationSecret(options?.secret)),
    );
    const provided = Buffer.from(providedSignature);
    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      return null;
    }

    const parsed = continuationPayloadSchema.parse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")),
    );
    const now = Math.floor((options?.now ?? new Date()).getTime() / 1000);
    if (
      parsed.expiresAt <= now ||
      parsed.issuedAt > now + 60 ||
      parsed.expiresAt - parsed.issuedAt > maxLifetimeSeconds
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * The return URL alone is not enough to skip onboarding. This checks the
 * short-lived server-signed context created by the publishing page.
 */
export function isNeedPublishingContinuation(
  returnTo: string | null | undefined,
  options?: { secret?: string; now?: Date },
) {
  const safeReturnTo = sanitizeReturnTo(returnTo, "");
  if (!safeReturnTo) return false;
  const url = new URL(safeReturnTo, "https://petnido.invalid");
  if (url.pathname !== "/needs/create") return false;
  const token = url.searchParams.get("needPublishContext");
  return token
    ? verifyNeedPublishingContinuationToken(token, options) !== null
    : false;
}
