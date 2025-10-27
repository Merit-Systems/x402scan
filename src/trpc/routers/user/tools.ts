import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  fetchFreepikMysticTask,
  fetchFreepikMysticTaskInputSchema,
} from '@/services/tools/freepik';
import { getSoraVideo, getSoraVideoInputSchema } from '@/services/tools/echo';

export const userToolsRouter = createTRPCRouter({
  freepik: {
    getTask: protectedProcedure
      .input(fetchFreepikMysticTaskInputSchema)
      .query(async ({ input }) => {
        return await fetchFreepikMysticTask(input);
      }),
  },

  echo: {
    sora: {
      getVideo: protectedProcedure
        .input(getSoraVideoInputSchema)
        .query(async ({ input }) => {
          return await getSoraVideo(input);
        }),
    },
  },
});
