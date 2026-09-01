import React, { Suspense } from "react";

import Link from "next/link";

import { Server } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Addresses } from "@/components/ui/address";
import { Avatar } from "@/components/ui/image-avatar";

import { FacilitatorChart, LoadingFacilitatorChart } from "./chart";
import { FacilitatorStats, LoadingFacilitatorStats } from "./stats";

import { useChain } from "@/app/(app)/_contexts/chain/hook";

import type { Facilitator } from "@/lib/facilitators";
import type { RouterOutputs } from "@/trpc/client";

interface Props {
  facilitator: Facilitator;
  stats: RouterOutputs["public"]["facilitators"]["list"]["items"][number];
}

export const FacilitatorCard: React.FC<Props> = ({ facilitator, stats }) => {
  const { chain } = useChain();

  return (
    <Link href={`/facilitator/${facilitator.id}`}>
      <Card className="grid grid-cols-1 transition-colors hover:border-primary hover:bg-card/80 md:grid-cols-7">
        <div className="col-span-5 flex flex-col">
          <div className="flex items-center gap-2 p-4">
            <Avatar
              src={facilitator.image}
              className="size-8 border-none"
              fallback={<Server className="size-8" />}
            />
            <div className="flex h-fit flex-col gap-1">
              <h1 className="wrap-break-words text-lg leading-none font-bold">
                {facilitator.name}
              </h1>
              <Addresses
                addresses={
                  chain
                    ? (facilitator.addresses[chain] ?? [])
                    : Object.values(facilitator.addresses).flat()
                }
                className="w-fit text-left text-xs leading-none"
              />
            </div>
          </div>
          <Suspense fallback={<LoadingFacilitatorChart />}>
            <FacilitatorChart facilitatorId={stats.facilitator_id} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <FacilitatorStats stats={stats} />
        </div>
      </Card>
    </Link>
  );
};

export const LoadingFacilitatorCard = () => {
  return (
    <Card className="grid grid-cols-1 md:grid-cols-7">
      <div className="col-span-5 flex flex-col">
        <div className="flex items-center gap-2 p-4">
          <Skeleton className="size-8" />
          <div className="flex h-fit flex-col gap-1">
            <Skeleton className="h-[18px] w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <LoadingFacilitatorChart />
      </div>
      <div className="col-span-2">
        <LoadingFacilitatorStats />
      </div>
    </Card>
  );
};
