import React, { Suspense } from "react";

import { Server } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Addresses } from "@/components/ui/address";
import { Avatar } from "@/components/ui/avatar";

import { OverallRecipientStats, LoadingOverallRecipientStats } from "./stats";
import { HeaderButtons, LoadingHeaderButtons } from "./buttons";

import { cn } from "@/lib/utils";

import type { Facilitator } from "@/lib/facilitators";

interface Props {
  facilitator: Facilitator;
}

export const HeaderCard: React.FC<Props> = ({ facilitator }) => {
  return (
    <Card className={cn("relative mt-10 md:mt-12")}>
      <Card className="absolute top-0 left-4 flex size-12 -translate-y-1/2 items-center justify-center overflow-hidden rounded-md border md:size-16">
        <Avatar
          src={facilitator.image}
          className="size-full rounded-none border-none"
          fallback={<Server className="size-8" />}
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="col-span-5 flex flex-col gap-4 p-4 pt-8 md:pt-10">
          <div className="">
            <h1 className="wrap-break-words line-clamp-2 text-3xl font-bold">
              {facilitator.name} Facilitator
            </h1>
            <p className={cn("wrap-break-words line-clamp-2")}>
              <Addresses
                addresses={Object.values(facilitator.addresses).flat()}
                className="border-none p-0 text-sm"
                side="bottom"
              />
            </p>
          </div>
          <HeaderButtons link={facilitator.docsUrl} />
        </div>
        <div className="col-span-2">
          <Suspense fallback={<LoadingOverallRecipientStats />}>
            <OverallRecipientStats id={facilitator.id} />
          </Suspense>
        </div>
      </div>
    </Card>
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
          <LoadingOverallRecipientStats />
        </div>
      </div>
    </Card>
  );
};
