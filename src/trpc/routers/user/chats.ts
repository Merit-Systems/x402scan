import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import {
  deleteChat,
  listChats,
  listChatsSchema,
} from '@/services/db/composer/chat';

export const userChatsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listChatsSchema)
    .query(async ({ input, ctx }) => {
      return await listChats(ctx.session.user.id, input);
    }),

  delete: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await deleteChat(input.chatId, ctx.session.user.id);
    }),
});
