import { ExternalLink } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  OriginSummary,
  OriginSummaryAvatar,
  OriginSummaryHeader,
  OriginSummaryName,
  OriginSummaryTrailing,
} from "@/components/ui/origin-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { cleanExternalText, truncateAtDelimiter } from "@/lib/utils";

import type { RouterOutputs } from "@/trpc/client";

import { InstallCommand, LoadingInstallCommand } from "./invoke";

type Origin = NonNullable<RouterOutputs["public"]["origins"]["get"]>;

export function ServerOverview({ origin }: { origin: Origin }) {
  const rawTitle = origin.title
    ? cleanExternalText(origin.title)
    : new URL(origin.origin).hostname;
  const title = truncateAtDelimiter(rawTitle);

  return (
    <div className="min-w-0 space-y-3">
      <div className="space-y-2">
        <OriginSummary>
          <OriginSummaryAvatar
            origin={origin.origin}
            size="default"
            src={origin.favicon}
          />
          <OriginSummaryHeader>
            <OriginSummaryName variant="page-title" lines={2}>
              {title}
            </OriginSummaryName>
            <OriginSummaryTrailing>
              <a
                aria-label={`Open ${title}`}
                className={buttonVariants({
                  size: "icon-sm",
                  variant: "quiet",
                })}
                href={origin.origin}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink />
                <span className="sr-only">Open {title}</span>
              </a>
            </OriginSummaryTrailing>
          </OriginSummaryHeader>
        </OriginSummary>
        {origin.description ? (
          <p className="max-w-2xl text-muted-foreground">
            {cleanExternalText(origin.description)}
          </p>
        ) : null}
      </div>
      <InstallCommand serverUrl={origin.origin} />
    </div>
  );
}

export function LoadingServerOverview() {
  return (
    <div className="min-w-0 space-y-3">
      <div className="space-y-2">
        <OriginSummary>
          <OriginSummaryAvatar
            fallback={<Skeleton className="size-full" />}
            size="default"
          />
          <OriginSummaryHeader>
            <OriginSummaryName variant="page-title">
              <Skeleton className="h-9 w-64 max-w-full" />
            </OriginSummaryName>
            <OriginSummaryTrailing>
              <Skeleton className="size-7" />
            </OriginSummaryTrailing>
          </OriginSummaryHeader>
        </OriginSummary>
        <Skeleton className="h-5 w-xl max-w-full" />
      </div>
      <LoadingInstallCommand />
    </div>
  );
}
