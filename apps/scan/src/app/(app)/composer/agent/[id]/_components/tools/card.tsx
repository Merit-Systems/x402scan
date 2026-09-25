import { Activity, Wrench } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Favicon } from "@/app/(app)/_components/favicon";
import { cleanExternalText } from "@/lib/utils";

import { formatTokenAmount } from "@/lib/token";

import type { RouterOutputs } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  resource: NonNullable<
    RouterOutputs["public"]["agents"]["get"]
  >["resources"][number];
}

export const ToolCard: React.FC<Props> = ({ resource }) => {
  return (
    <Card>
      <CardHeader className="overflow-hidden">
        <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
          <div className="flex flex-1 items-center gap-2 space-y-0 overflow-hidden">
            <Favicon url={resource.favicon} Fallback={Wrench} />
            <CardTitle className="flex-1 truncate">
              {resource.resource}
            </CardTitle>
            <span className="type-numeric type-emphasis type-label text-primary">
              {formatTokenAmount(
                BigInt(
                  resource.accepts.find((accept) => accept.maxAmountRequired)
                    ?.maxAmountRequired ?? 0
                )
              )}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Activity className="size-3" />
            <p className="type-supporting-body text-muted-foreground">
              {resource.usageCount}
            </p>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {cleanExternalText(
            resource.accepts.find((accept) => accept.description)
              ?.description ?? ""
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export const LoadingToolCard = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 space-y-0">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
      </CardHeader>
    </Card>
  );
};
