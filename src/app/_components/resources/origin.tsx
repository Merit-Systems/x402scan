import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Favicon } from '@/app/_components/favicon';

import { cn } from '@/lib/utils';

import type { OgImage, ResourceOrigin } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';

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
      className="overflow-hidden flex w-full hover:border-primary transition-colors cursor-pointer items-stretch"
      onClick={onClick}
    >
      <div className="flex-1">
        <CardHeader
          className={cn(
            'space-y-0 flex flex-row items-center gap-2 bg-muted p-2 md:p-4',
            hasMetadata && 'border-b'
          )}
        >
          <Favicon url={origin.favicon} className="size-6" />
          <CardTitle className="font-bold text-base md:text-lg">
            {new URL(origin.origin).hostname}{' '}
            <span className="text-muted-foreground text-xs md:text-sm ml-2">
              {numResources} resource{numResources === 1 ? '' : 's'}
            </span>
          </CardTitle>
        </CardHeader>
        {hasMetadata && (
          <CardContent className="flex flex-row items-start justify-between gap-2 p-0">
            <div className="flex flex-col gap-2 p-4">
              <div>
                <h3
                  className={cn(
                    'font-medium text-sm md:text-base',
                    !origin.title && 'opacity-60'
                  )}
                >
                  {origin.title ?? 'No Title'}
                </h3>
                <p
                  className={cn(
                    'text-xs md:text-sm text-muted-foreground',
                    !origin.description && 'text-muted-foreground/60'
                  )}
                >
                  {origin.description ?? 'No Description'}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </div>
      {origin.ogImages.length > 0 && (
        <div className="border-l hidden md:flex items-center justify-center bg-muted p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={origin.ogImages[0].url}
            alt={origin.ogImages[0].title ?? ''}
            className="rounded-md max-h-24"
          />
        </div>
      )}
    </Card>
  );
};

export const LoadingOriginCard: React.FC = () => {
  return (
    <Card className="overflow-hidden flex w-full hover:border-primary transition-colors cursor-pointer items-stretch">
      <div className="flex-1">
        <CardHeader
          className={cn('space-y-0 flex flex-row items-center gap-2 bg-muted')}
        >
          <Skeleton className="size-6" />
          <Skeleton className="w-36 h-[16px] md:h-[18px]" />
        </CardHeader>
        <CardContent className="flex flex-row items-start justify-between gap-2 p-0">
          <div className="flex flex-col gap-2 p-4 w-full">
            <Skeleton className="w-48 h-[16px] md:h-[18px]" />
            <Skeleton className="w-full h-[12px] md:h-[14px]" />
          </div>
        </CardContent>
      </div>
      <div className="hidden md:flex items-center justify-center bg-muted p-4 border-l">
        <Skeleton className="h-24 aspect-video" />
      </div>
    </Card>
  );
};
