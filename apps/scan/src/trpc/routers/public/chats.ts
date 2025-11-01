import z from 'zod';

import { auth } from '@/auth';

import { getChat } from '@/services/db/composer/chat';

import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';

export const publicChatsRouter = createTRPCRouter({
  get: publicProcedure.input(z.string()).query(async ({ input }) => {
    const session = await auth();
    return await getChat(input, session?.user?.id);
  }),
});
