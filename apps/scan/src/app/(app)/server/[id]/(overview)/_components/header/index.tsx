import React, { Suspense } from "react";

import { Server, ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/ui/image-avatar";

import { OriginStats, LoadingOriginStats } from "./stats";

import { cleanExternalText, truncateAtDelimiter, cn } from "@/lib/utils";

import { HeaderButtons, LoadingHeaderButtons } from "./buttons";

import type { RouterOutputs } from "@/trpc/client";
import { X402V2Badge } from "@/app/(app)/_components/x402/v2-badge";
import { ShareModal } from "../share-modal";

interface Props {
  origin: NonNullable<RouterOutputs["public"]["origins"]["get"]>;
}

export const HeaderCard: React.FC<Props> = ({ origin }) => {
  const rawTitle = origin.title
    ? cleanExternalText(origin.title)
    : new URL(origin.origin).hostname;
  const originTitle = truncateAtDelimiter(rawTitle);

  return (
    <Card className={cn("relative mt-10 md:mt-12")}>
      <Card className="absolute top-0 left-4 flex size-12 -translate-y-1/2 items-center justify-center overflow-hidden rounded-md border md:size-16">
        <Avatar
          src={origin.favicon}
          className="size-full rounded-none border-none"
          fallback={<Server className="size-8" />}
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="col-span-5 flex flex-col gap-3 p-4 pt-8 md:pt-10">
          <div className="space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <a
                href={origin.origin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
              >
                <h1 className="line-clamp-2 min-w-0 text-xl font-bold wrap-break-word md:text-3xl">
                  {originTitle}
                </h1>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground md:size-5" />
              </a>
              {origin.hasX402V2Resource && (
                <X402V2Badge className="mt-1 shrink-0" />
              )}
              <div className="ml-auto shrink-0">
                <ShareModal
                  originTitle={originTitle}
                  originId={origin.id}
                  origin={origin}
                />
              </div>
            </div>
            <p
              className={cn(
                "wrap-break-word line-clamp-2 text-sm md:text-base",
                !origin.description
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground"
              )}
            >
              {origin.description
                ? cleanExternalText(origin.description)
                : "No Description"}
            </p>
          </div>
          <HeaderButtons origin={origin} />
        </div>
        <div className="col-span-2">
          <Suspense fallback={<LoadingOriginStats />}>
            <OriginStats originId={origin.id} />
          </Suspense>
        </div>
      </div>
    </Card>
  );
};

export const LoadingHeaderCard = () => {
  return (
    <Card className={cn("relative mt-10 md:mt-12")}>
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
            <Skeleton className="my-[2px] h-[14px] w-48" />
            <Skeleton className="my-[4px] h-[16px] w-64" />
          </div>
          <LoadingHeaderButtons />
        </div>
        <div className="col-span-2 overflow-hidden">
          <LoadingOriginStats />
        </div>
      </div>
    </Card>
  );
};
