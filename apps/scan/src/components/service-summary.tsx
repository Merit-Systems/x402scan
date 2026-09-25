"use client";

import {
  OriginSummary,
  OriginSummaryAvatar,
  OriginSummaryDescription,
  OriginSummaryHeader,
  OriginSummaryName,
  OriginSummaryTrailing,
} from "@/components/ui/origin-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { cleanExternalText, cn, truncateAtDelimiter } from "@/lib/utils";

import type {
  OriginSummaryNameProps,
  OriginSummaryProps,
} from "@/components/ui/origin-summary";
import type { RouterOutputs } from "@/trpc/client";

type ServiceSummaryItem = Pick<
  RouterOutputs["public"]["sellers"]["bazaar"]["list"]["items"][number],
  "origins"
>;

export function ServiceSummary({
  item,
  className,
  descriptionPlacement,
  nameVariant,
}: {
  item: ServiceSummaryItem;
  className?: string;
  descriptionPlacement?: OriginSummaryProps["descriptionPlacement"];
  nameVariant?: OriginSummaryNameProps["variant"];
}) {
  const origin = item.origins[0];
  if (!origin) return null;

  const hostname = new URL(origin.origin).hostname;
  const rawTitle = origin.title?.trim();
  const cleanTitle = rawTitle ? cleanExternalText(rawTitle) : hostname;
  const title = truncateAtDelimiter(cleanTitle);
  const rawDescription = origin.description?.trim();
  const description = rawDescription ? cleanExternalText(rawDescription) : null;
  const otherOrigins = item.origins.slice(1);

  return (
    <OriginSummary
      className={cn("max-w-full overflow-hidden", className)}
      descriptionPlacement={descriptionPlacement}
    >
      <OriginSummaryAvatar origin={origin.origin} src={origin.favicon} />
      <OriginSummaryHeader>
        <OriginSummaryName variant={nameVariant}>{title}</OriginSummaryName>
        {otherOrigins.length > 0 ? (
          <OriginSummaryTrailing>
            <span className="type-caption text-muted-foreground">
              +{otherOrigins.length}
            </span>
          </OriginSummaryTrailing>
        ) : null}
      </OriginSummaryHeader>
      {description ? (
        <OriginSummaryDescription lines={2}>
          {description}
        </OriginSummaryDescription>
      ) : null}
    </OriginSummary>
  );
}

export function LoadingServiceSummary({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex max-w-full min-w-0 items-center gap-3 overflow-hidden",
        className
      )}
    >
      <Skeleton className="size-6 rounded-md" />
      <div className="flex max-w-full min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
        <Skeleton className="my-[3px] h-[14px] w-32" />
        <div className="flex flex-col gap-px">
          <Skeleton className="my-[2px] h-[10px] w-5/6" />
          <Skeleton className="my-[2px] h-[10px] w-1/4" />
        </div>
      </div>
    </div>
  );
}
