import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import {
  getChat,
  getChatsByUserId,
  updateChat,
  deleteChat,
  updateChatSchema,
} from '@/services/db/chats';

export const chatsRouter = createTRPCRouter({
  // Get all chats for the current user
  getUserChats: protectedProcedure.query(async ({ ctx }) => {
    return await getChatsByUserId(ctx.session.user.id);
  }),

  // Get or create a chat - unified endpoint
  getChat: protectedProcedure.input(z.uuid()).query(async ({ input, ctx }) => {
    return await getChat(input, ctx.session.user.id);
  }),

  // Update chat (mainly for title changes)
  updateChat: protectedProcedure
    .input(updateChatSchema)
    .mutation(async ({ input, ctx }) => {
      return await updateChat(ctx.session.user.id, input);
    }),

  // Delete a chat
  deleteChat: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await deleteChat(input.chatId, ctx.session.user.id);
    }),
});
