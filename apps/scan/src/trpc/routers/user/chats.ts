import { z } from "zod";

import {
  deleteChat,
  listChats,
  listChatsSchema,
} from "@/services/db/composer/chat";
import { createTRPCRouter, protectedProcedure } from "@/trpc/trpc";

export const userChatsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listChatsSchema)
    .query(async ({ input, ctx }) => {
      return listChats(ctx.session.user.id, input);
    }),

  delete: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return deleteChat(input.chatId, ctx.session.user.id);
    }),
});
