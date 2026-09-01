import { z } from "zod";

export const favoriteTargetSchema = z.object({
  kind: z.enum(["NEED", "SERVICE"]),
  publicId: z.string().min(1).max(256),
}).strict().transform((input, ctx) => {
  const separator = input.publicId.indexOf(":");
  const prefix = input.publicId.slice(0, separator);
  const targetId = input.publicId.slice(separator + 1);
  if (!targetId || prefix !== "v2") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_PUBLIC_ID" });
    return z.NEVER;
  }
  return {
    kind: input.kind,
    publicId: input.publicId,
    source: "V2" as const,
    targetId,
  };
});

export function needFavoriteAvailability(
  need: { state: string; endsAt: Date; archivedAt: Date | null },
  now: Date,
) {
  if (need.endsAt <= now) return "EXPIRED" as const;
  if (need.state !== "OPEN" || need.archivedAt !== null) return "UNAVAILABLE" as const;
  return "AVAILABLE" as const;
}

export function serviceFavoriteAvailability(service: {
  active: boolean;
  archivedAt: Date | null;
  providerAccepting: boolean;
}) {
  return service.active && service.archivedAt === null && service.providerAccepting
    ? "AVAILABLE" as const
    : "UNAVAILABLE" as const;
}
