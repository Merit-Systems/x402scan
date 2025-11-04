import { freeTierConfig } from '@/lib/free-tier';
import {
  getUserMessageCount,
  getUserToolCallCount,
} from '@/services/db/user/chat';
import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

export const userFreeTierRouter = createTRPCRouter({
  usage: protectedProcedure.query(async ({ ctx }) => {
    const [messageCount, toolCallCount] = await Promise.all([
      getUserMessageCount(ctx.session.user.id),
      getUserToolCallCount(ctx.session.user.id),
    ]);
    const remainingMessageCount = freeTierConfig.numMessages - messageCount;
    const remainingToolCallCount = freeTierConfig.numToolCalls - toolCallCount;
    const hasFreeTier = remainingMessageCount > 0 && remainingToolCallCount > 0;
    return {
      messageCount,
      toolCallCount,
      remainingMessageCount: Math.max(0, remainingMessageCount),
      remainingToolCallCount: Math.max(0, remainingToolCallCount),
      hasFreeTier,
    };
  }),
});
