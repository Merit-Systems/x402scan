import { Suspense } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";

import { LoadingOverallBuyerStats } from "./stats";

import { cn } from "@/lib/utils";

import { HydrateClient } from "@/trpc/server";
import { LoadingHeaderButtons } from "./buttons";
import { HeaderCardContent } from "./content";

interface Props {
  address: string;
}

export const HeaderCard: React.FC<Props> = ({ address }) => {
  return (
    <HydrateClient>
      <Suspense fallback={<LoadingHeaderCard />}>
        <HeaderCardContent address={address} />
      </Suspense>
    </HydrateClient>
  );
};

export const LoadingHeaderCard = () => {
  return (
    <Card className={cn("relative mt-10 md:mt-12 mb-12")}>
      <Card className="absolute top-0 left-4 flex size-12 -translate-y-1/2 items-center justify-center overflow-hidden rounded-md border md:size-16">
        <Avatar
          src={undefined}
          className="size-full"
          fallback={<Skeleton className="size-8" />}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="col-span-5 flex flex-col gap-4 p-4 pt-8 md:pt-10">
          <div className="">
            <Skeleton className="my-[3px] h-[30px] w-36" />
            <Skeleton className="my-[4px] h-[16px] w-64" />
          </div>
          <LoadingHeaderButtons />
        </div>
        <div className="col-span-2 overflow-hidden">
          <LoadingOverallBuyerStats />
        </div>
      </div>
    </Card>
  );
};
