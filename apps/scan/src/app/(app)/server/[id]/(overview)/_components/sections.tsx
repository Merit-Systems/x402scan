import { notFound } from "next/navigation";

import { getOriginPayToAddresses } from "@/services/db/resources/origin";
import {
  getBucketedStatisticsMV,
  bucketedStatisticsMVInputSchema,
} from "@/services/transfers/stats/bucketed-mv";
import {
  getOverallStatisticsMV,
  overallStatisticsMVInputSchema,
} from "@/services/transfers/stats/overall-mv";
import { ActivityTimeframe } from "@/types/timeframes";

import { getServerOrigin } from "../../_lib/get-origin";
import { ServerOverview } from "./overview";
import { OriginResources } from "./resources";
import { ServerStatCards } from "./stat-cards";

export async function Overview({
  params,
}: Pick<PageProps<"/server/[id]">, "params">) {
  const { id } = await params;
  const origin = await getServerOrigin(id);
  if (!origin) notFound();
  return <ServerOverview origin={origin} />;
}

export async function Statistics({
  params,
}: Pick<PageProps<"/server/[id]">, "params">) {
  const { id } = await params;
  if (!(await getServerOrigin(id))) notFound();
  const addresses = await getOriginPayToAddresses(id);
  const input = {
    recipients: { include: addresses },
    timeframe: ActivityTimeframe.ThirtyDays,
  };
  const [overall, timeSeries] = await Promise.all([
    getOverallStatisticsMV(overallStatisticsMVInputSchema.parse(input)),
    getBucketedStatisticsMV(
      bucketedStatisticsMVInputSchema.parse({ ...input, numBuckets: 48 })
    ),
  ]);
  return <ServerStatCards overall={overall} timeSeries={timeSeries} />;
}

export async function Resources({
  params,
}: Pick<PageProps<"/server/[id]">, "params">) {
  const { id } = await params;
  if (!(await getServerOrigin(id))) notFound();
  return <OriginResources originId={id} />;
}
