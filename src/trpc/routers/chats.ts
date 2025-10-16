import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';
import {
  createChat,
  getChatById,
  getChatsByUserId,
  updateChat,
  deleteChat,
  createMessage,
} from '@/services/db/chats';
import { Visibility } from '@prisma/client';

export const chatsRouter = createTRPCRouter({
  // Get all chats for the current user
  getUserChats: protectedProcedure.query(async ({ ctx }) => {
    return await getChatsByUserId(ctx.session.user.id);
  }),

  // Get or create a chat - unified endpoint
  getOrCreateChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string().optional(),
        title: z.string().min(1).max(255).optional(),
        visibility: z.nativeEnum(Visibility).optional().default('private'),
      })
    )
    .query(async ({ input, ctx }) => {
      // If chatId is provided, get existing chat
      if (input.chatId) {
        const chat = await getChatById(input.chatId);

        // Ensure user owns this chat
        if (!chat || chat.userId !== ctx.session.user.id) {
          throw new Error('Chat not found or access denied');
        }

        return chat;
      }

      // Otherwise create a new chat with default title
      const defaultTitle = input.title ?? 'New Chat';

      return await createChat({
        title: defaultTitle,
        visibility: input.visibility,
        user: {
          connect: { id: ctx.session.user.id },
        },
      });
    }),

  // Update chat (mainly for title changes)
  updateChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        title: z.string().min(1).max(255).optional(),
        visibility: z.nativeEnum(Visibility).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existingChat = await getChatById(input.chatId);
      if (!existingChat || existingChat.userId !== ctx.session.user.id) {
        throw new Error('Chat not found or access denied');
      }

      const updateData: { title?: string; visibility?: Visibility } = {};
      if (input.title) updateData.title = input.title;
      if (input.visibility) updateData.visibility = input.visibility;

      return await updateChat(input.chatId, updateData);
    }),

  // Create a new chat
  createChat: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255).optional(),
        visibility: z.nativeEnum(Visibility).optional().default('private'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const defaultTitle = input.title ?? 'New Chat';

      return await createChat({
        title: defaultTitle,
        visibility: input.visibility,
        user: {
          connect: { id: ctx.session.user.id },
        },
      });
    }),

  // Delete a chat
  deleteChat: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existingChat = await getChatById(input.chatId);
      if (!existingChat || existingChat.userId !== ctx.session.user.id) {
        throw new Error('Chat not found or access denied');
      }

      return await deleteChat(input.chatId);
    }),

  // Add a message to a chat
  addMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        role: z.string(),
        parts: z.unknown(),
        attachments: z.unknown().optional().default({}),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify chat ownership
      const chat = await getChatById(input.chatId);
      if (!chat || chat.userId !== ctx.session.user.id) {
        throw new Error('Chat not found or access denied');
      }

      return await createMessage({
        role: input.role,
        parts: input.parts as string,
        attachments: input.attachments as object,
        chat: {
          connect: { id: input.chatId },
        },
      });
    }),
});
