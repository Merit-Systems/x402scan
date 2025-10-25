import { z } from 'zod';

import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '@/trpc/trpc';

import { getAgentConfiguration } from '@/services/db/agent-config/get';
import {
  listTopAgentConfigurations,
  listTopAgentConfigurationsSchema,
} from '@/services/db/agent-config/list';
import {
  agentConfigBucketedActivityInputSchema,
  getAgentConfigBucketedActivity,
} from '@/services/db/agent-config/stats/agent';
import {
  getOverallActivity,
  getOverallBucketedActivity,
  overallActivityInputSchema,
  overallBucketedActivityInputSchema,
} from '@/services/db/agent-config/stats/overall';
import {
  getAgentConfigFeed,
  getAgentConfigFeedSchema,
} from '@/services/db/agent-config/feed';

import { auth } from '@/auth';

export const publicAgentConfigurationsRouter = createTRPCRouter({
  get: publicProcedure.input(z.uuid()).query(async ({ input }) => {
    const session = await auth();
    return await getAgentConfiguration(input, session?.user?.id);
  }),

  list: paginatedProcedure
    .input(listTopAgentConfigurationsSchema)
    .query(async ({ input, ctx: { pagination } }) => {
      return await listTopAgentConfigurations(input, pagination);
    }),

  activity: {
    agent: {
      bucketed: publicProcedure
        .input(agentConfigBucketedActivityInputSchema)
        .query(async ({ input }) => {
          return await getAgentConfigBucketedActivity(input);
        }),
    },
    overall: publicProcedure
      .input(overallActivityInputSchema)
      .query(async ({ input }) => {
        return await getOverallActivity(input);
      }),
    bucketed: publicProcedure
      .input(overallBucketedActivityInputSchema)
      .query(async ({ input }) => {
        return await getOverallBucketedActivity(input);
      }),
    feed: paginatedProcedure
      .input(getAgentConfigFeedSchema)
      .query(async ({ input, ctx: { pagination } }) => {
        return await getAgentConfigFeed(input, pagination);
      }),
  },
});
