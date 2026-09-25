import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Favicon } from "@/app/(app)/_components/favicon";

import { cleanExternalText, cn } from "@/lib/utils";

import type { OgImage, ResourceOrigin } from "@x402scan/scan-db/types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  origin: ResourceOrigin & {
    ogImages: OgImage[];
  };
  numResources: number;
  onClick?: () => void;
}

export const OriginCard: React.FC<Props> = ({
  origin,
  numResources,
  onClick,
}) => {
  const hasMetadata =
    origin.title !== null ||
    origin.description !== null ||
    origin.ogImages.length > 0;

  return (
    <Card
      className="flex w-full cursor-pointer items-stretch overflow-hidden transition-colors hover:border-primary"
      onClick={onClick}
    >
      <div className="flex-1">
        <CardHeader
          className={cn(
            "space-y-0 flex flex-row items-center gap-2 bg-muted p-2 md:p-4",
            hasMetadata && "border-b"
          )}
        >
          <Favicon url={origin.favicon} className="size-6" />
          <CardTitle className="text-base font-bold md:text-lg">
            {new URL(origin.origin).hostname}{" "}
            <span className="ml-2 text-xs text-muted-foreground md:text-sm">
              {numResources} resource{numResources === 1 ? "" : "s"}
            </span>
          </CardTitle>
        </CardHeader>
        {hasMetadata && (
          <CardContent className="flex flex-row items-start justify-between gap-2 p-0">
            <div className="flex flex-col gap-2 p-4">
              <div>
                <h3
                  className={cn(
                    "font-medium text-sm md:text-base",
                    !origin.title && "opacity-60"
                  )}
                >
                  {origin.title ? cleanExternalText(origin.title) : "No Title"}
                </h3>
                <p
                  className={cn(
                    "text-xs md:text-sm text-muted-foreground",
                    !origin.description && "text-muted-foreground/60"
                  )}
                >
                  {origin.description
                    ? cleanExternalText(origin.description)
                    : "No Description"}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </div>
      {origin.ogImages.length > 0 && (
        <div className="hidden items-center justify-center border-l bg-muted p-4 md:flex">
          <img
            src={origin.ogImages[0]!.url}
            alt={
              origin.ogImages[0]!.title
                ? cleanExternalText(origin.ogImages[0]!.title)
                : ""
            }
            className="max-h-24 rounded-md"
          />
        </div>
      )}
    </Card>
  );
};

export const LoadingOriginCard: React.FC = () => {
  return (
    <Card className="flex w-full cursor-pointer items-stretch overflow-hidden transition-colors hover:border-primary">
      <div className="flex-1">
        <CardHeader
          className={cn("space-y-0 flex flex-row items-center gap-2 bg-muted")}
        >
          <Skeleton className="size-6" />
          <Skeleton className="h-[16px] w-36 md:h-[18px]" />
        </CardHeader>
        <CardContent className="flex flex-row items-start justify-between gap-2 p-0">
          <div className="flex w-full flex-col gap-2 p-4">
            <Skeleton className="h-[16px] w-48 md:h-[18px]" />
            <Skeleton className="h-[12px] w-full md:h-[14px]" />
          </div>
        </CardContent>
      </div>
      <div className="hidden items-center justify-center border-l bg-muted p-4 md:flex">
        <Skeleton className="aspect-video h-24" />
      </div>
    </Card>
  );
};
