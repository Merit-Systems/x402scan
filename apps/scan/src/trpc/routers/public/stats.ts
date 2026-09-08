import z from "zod";

import { getOriginPayToAddresses } from "@/services/db/resources/origin";
import {
  getBucketedStatisticsMV,
  bucketedStatisticsMVInputSchema,
} from "@/services/transfers/stats/bucketed-mv";
import {
  getOverallStatisticsMV,
  overallStatisticsMVInputSchema,
} from "@/services/transfers/stats/overall-mv";

import { createTRPCRouter, publicProcedure } from "../../trpc";

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
    .query(async ({ input }) => {
      return getOverallStatisticsMV(input);
    }),
  bucketed: publicProcedure
    .input(bucketedStatisticsMVInputSchema)
    .query(async ({ input }) => {
      return getBucketedStatisticsMV(input);
    }),
  overallByOrigin: publicProcedure
    .input(overallByOriginInputSchema)
    .query(async ({ input }) => {
      const { originId, ...rest } = input;
      const addresses = await getOriginPayToAddresses(originId);
      return getOverallStatisticsMV({
        ...rest,
        recipients: { include: addresses },
      });
    }),
  bucketedByOrigin: publicProcedure
    .input(bucketedByOriginInputSchema)
    .query(async ({ input }) => {
      const { originId, ...rest } = input;
      const addresses = await getOriginPayToAddresses(originId);
      return getBucketedStatisticsMV({
        ...rest,
        recipients: { include: addresses },
      });
    }),
});
