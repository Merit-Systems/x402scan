import { notFound } from "next/navigation";

import { api, HydrateClient } from "@/trpc/server";
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
  void api.public.stats.overallByOrigin.prefetch({
    originId: id,
    timeframe: ActivityTimeframe.ThirtyDays,
  });
  void api.public.stats.bucketedByOrigin.prefetch({
    originId: id,
    numBuckets: 48,
    timeframe: ActivityTimeframe.ThirtyDays,
  });
  return (
    <HydrateClient>
      <ServerStatCards originId={id} />
    </HydrateClient>
  );
}

export async function Resources({
  params,
}: Pick<PageProps<"/server/[id]">, "params">) {
  const { id } = await params;
  if (!(await getServerOrigin(id))) notFound();
  return <OriginResources originId={id} />;
}
