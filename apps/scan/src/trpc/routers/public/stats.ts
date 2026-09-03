import z from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  getOverallStatisticsMV,
  overallStatisticsMVInputSchema,
} from "@/services/transfers/stats/overall-mv";
import {
  getBucketedStatisticsMV,
  bucketedStatisticsMVInputSchema,
} from "@/services/transfers/stats/bucketed-mv";
import { getOriginPayToAddresses } from "@/services/db/resources/origin";

// Origin-scoped variants resolve the origin's payTo addresses server-side so
// clients never ship the full address list over the wire (large origins
// exceeded httpBatchLink's maxURLLength).
const overallByOriginInputSchema = overallStatisticsMVInputSchema
  .omit({ senders: true, recipients: true, facilitatorIds: true })
  .extend({ originId: z.uuid() });

const bucketedByOriginInputSchema = bucketedStatisticsMVInputSchema
  .omit({ senders: true, recipients: true, facilitatorIds: true })
  .extend({ originId: z.uuid() });

export const statsRouter = createTRPCRouter({
  overall: publicProcedure
    .input(overallStatisticsMVInputSchema)
    .query(async ({ input, ctx }) => {
      return getOverallStatisticsMV(input, ctx);
    }),
  bucketed: publicProcedure
    .input(bucketedStatisticsMVInputSchema)
    .query(async ({ input, ctx }) => {
      return getBucketedStatisticsMV(input, ctx);
    }),
  overallByOrigin: publicProcedure
    .input(overallByOriginInputSchema)
    .query(async ({ input, ctx }) => {
      const { originId, ...rest } = input;
      const addresses = await getOriginPayToAddresses(originId);
      return getOverallStatisticsMV(
        { ...rest, recipients: { include: addresses } },
        ctx
      );
    }),
  bucketedByOrigin: publicProcedure
    .input(bucketedByOriginInputSchema)
    .query(async ({ input, ctx }) => {
      const { originId, ...rest } = input;
      const addresses = await getOriginPayToAddresses(originId);
      return getBucketedStatisticsMV(
        { ...rest, recipients: { include: addresses } },
        ctx
      );
    }),
});
