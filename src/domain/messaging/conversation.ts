import { z } from "zod";

export const conversationContextTargetSchema = z.object({
  kind: z.enum(["NEED", "SERVICE"]),
  publicId: z.string().min(1).max(128),
}).strict().transform((input, ctx) => {
  const separator = input.publicId.indexOf(":");
  const source = input.publicId.slice(0, separator);
  const contextId = input.publicId.slice(separator + 1);
  if (!contextId || (source !== "v2" && source !== "legacy")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_PUBLIC_TARGET" });
    return z.NEVER;
  }
  return {
    kind: input.kind,
    publicId: input.publicId,
    source: source === "v2" ? "V2" as const : "LEGACY" as const,
    contextId,
  };
});
export type ConversationContextTarget = z.output<typeof conversationContextTargetSchema>;

export const messageBodySchema = z.string().trim().min(1).max(4000);
export const clientMessageIdSchema = z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);

export function conversationPairKey(firstUserId: string, secondUserId: string) {
  if (!firstUserId || !secondUserId || firstUserId === secondUserId) {
    throw new Error("INVALID_CONVERSATION_PARTICIPANTS");
  }
  const [first, second] = [firstUserId, secondUserId].sort();
  return `${first.length}:${first}${second.length}:${second}`;
}

export type MessageCursor = { createdAt: string; id: string };

export function encodeMessageCursor(cursor: MessageCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeMessageCursor(value: string | null | undefined): MessageCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<MessageCursor>;
    if (typeof parsed.createdAt !== "string" || Number.isNaN(new Date(parsed.createdAt).valueOf()) || typeof parsed.id !== "string" || !parsed.id) return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export function hasUnreadMessages(lastMessageAt: Date | null, lastReadAt: Date | null) {
  return Boolean(lastMessageAt && (!lastReadAt || lastMessageAt > lastReadAt));
}
