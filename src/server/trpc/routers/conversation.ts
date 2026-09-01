import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  clientMessageIdSchema,
  conversationContextTargetSchema,
  decodeMessageCursor,
  encodeMessageCursor,
  hasUnreadMessages,
  messageBodySchema,
} from "@/domain/messaging/conversation";
import {
  ConversationCommandError,
  sendConversationMessage,
  startConsultation,
} from "@/server/domains/messaging/conversation-v2";
import { protectedProcedure, router } from "@/server/trpc/trpc";

function commandError(error: unknown): never {
  if (error instanceof ConversationCommandError) {
    throw new TRPCError({
      code: error.code === "RESOURCE_NOT_FOUND" ? "NOT_FOUND" : "FORBIDDEN",
      message: error.code,
      cause: error,
    });
  }
  throw error;
}

export const conversationRouter = router({
  startConsultation: protectedProcedure
    .input(z.object({
      target: z.object({ kind: z.enum(["NEED", "SERVICE"]), publicId: z.string().min(1).max(128) }).strict(),
      body: messageBodySchema,
      clientMessageId: clientMessageIdSchema,
    }).strict())
    .mutation(async ({ ctx, input }) => {
      try {
        return await startConsultation(ctx.prisma, {
          actorId: ctx.session.user.id,
          target: conversationContextTargetSchema.parse(input.target),
          body: input.body,
          clientMessageId: input.clientMessageId,
        });
      } catch (error) {
        commandError(error);
      }
    }),

  listMine: protectedProcedure
    .input(z.object({ includeArchived: z.boolean().default(false) }).strict().default({ includeArchived: false }))
    .query(async ({ ctx, input }) => {
      if (ctx.validationFailure === "conversation-list") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DEPENDENCY_UNAVAILABLE",
        });
      }
      const userId = ctx.session.user.id;
      const conversations = await ctx.prisma.conversationV2.findMany({
        where: {
          participants: { some: { userId, ...(input.includeArchived ? {} : { archivedAt: null }) } },
        },
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
        include: {
          participants: {
            select: {
              userId: true,
              lastReadAt: true,
              archivedAt: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
          messages: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 1,
            select: { id: true, kind: true, body: true, senderId: true, createdAt: true },
          },
        },
      });
      return conversations.map((conversation) => {
        const ownParticipant = conversation.participants.find((participant) => participant.userId === userId)!;
        const counterpart = conversation.participants.find((participant) => participant.userId !== userId)?.user ?? null;
        const lastMessage = conversation.messages[0] ?? null;
        return {
          id: conversation.id,
          context: {
            kind: conversation.contextKind,
            publicId: `${conversation.contextSource === "V2" ? "v2" : "legacy"}:${conversation.contextId}`,
            title: conversation.contextTitle,
            mode: conversation.contextMode,
          },
          counterpart,
          lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unread: hasUnreadMessages(conversation.lastMessageAt, ownParticipant.lastReadAt),
          archived: ownParticipant.archivedAt !== null,
        };
      });
    }),

  listMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string().min(1).max(128),
      cursor: z.string().max(1024).nullish(),
      limit: z.number().int().min(1).max(50).default(30),
    }).strict())
    .query(async ({ ctx, input }) => {
      const cursor = decodeMessageCursor(input.cursor);
      if (input.cursor && !cursor) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURSOR" });
      const participant = await ctx.prisma.conversationParticipantV2.findUnique({
        where: { conversationId_userId: { conversationId: input.conversationId, userId: ctx.session.user.id } },
        select: { userId: true },
      });
      if (!participant) throw new TRPCError({ code: "FORBIDDEN", message: "FORBIDDEN_RESOURCE_ACTION" });
      const messages = await ctx.prisma.messageV2.findMany({
        where: {
          conversationId: input.conversationId,
          ...(cursor ? {
            OR: [
              { createdAt: { lt: new Date(cursor.createdAt) } },
              { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
            ],
          } : {}),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        select: {
          id: true,
          kind: true,
          body: true,
          systemCode: true,
          createdAt: true,
          sender: { select: { id: true, name: true, image: true } },
        },
      });
      const hasMore = messages.length > input.limit;
      const items = messages.slice(0, input.limit);
      const last = items.at(-1);
      return {
        items,
        nextCursor: hasMore && last ? encodeMessageCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null,
      };
    }),

  send: protectedProcedure
    .input(z.object({
      conversationId: z.string().min(1).max(128),
      body: messageBodySchema,
      clientMessageId: clientMessageIdSchema,
    }).strict())
    .mutation(async ({ ctx, input }) => {
      try {
        return await sendConversationMessage(ctx.prisma, { ...input, actorId: ctx.session.user.id });
      } catch (error) {
        commandError(error);
      }
    }),

  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string().min(1).max(128) }).strict())
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversationV2.findFirst({
        where: { id: input.conversationId, participants: { some: { userId: ctx.session.user.id } } },
        select: { lastMessageAt: true },
      });
      if (!conversation) throw new TRPCError({ code: "FORBIDDEN", message: "FORBIDDEN_RESOURCE_ACTION" });
      await ctx.prisma.conversationParticipantV2.update({
        where: { conversationId_userId: { conversationId: input.conversationId, userId: ctx.session.user.id } },
        data: { lastReadAt: conversation.lastMessageAt ?? new Date() },
      });
      return { read: true };
    }),

  setArchived: protectedProcedure
    .input(z.object({ conversationId: z.string().min(1).max(128), archived: z.boolean() }).strict())
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.conversationParticipantV2.updateMany({
        where: { conversationId: input.conversationId, userId: ctx.session.user.id },
        data: { archivedAt: input.archived ? new Date() : null },
      });
      if (!updated.count) throw new TRPCError({ code: "FORBIDDEN", message: "FORBIDDEN_RESOURCE_ACTION" });
      return { archived: input.archived };
    }),
});
