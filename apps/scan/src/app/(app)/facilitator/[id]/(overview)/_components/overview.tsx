import { ExternalLink, Server } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/image-avatar";
import { Skeleton } from "@/components/ui/skeleton";

import type { Facilitator } from "@/lib/facilitators";

export function FacilitatorOverview({
  facilitator,
}: {
  facilitator: Facilitator;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            className="shrink-0"
            fallback={<Server />}
            size="default"
            src={facilitator.image}
          />
          <h1 className="type-page-title truncate">{facilitator.name}</h1>
        </div>
        <a
          aria-label={`Open ${facilitator.name} documentation`}
          className={buttonVariants({ size: "icon-sm", variant: "quiet" })}
          href={facilitator.docsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink />
          <span className="sr-only">Open documentation</span>
        </a>
      </div>
      <p className="text-muted-foreground">x402 payment facilitator</p>
    </div>
  );
}

export function LoadingFacilitatorOverview() {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-10 rounded-md" />
          <Skeleton className="h-8 w-48 max-w-full" />
        </div>
        <Skeleton className="size-7" />
      </div>
      <Skeleton className="h-5 w-40 max-w-full" />
    </div>
  );
}
