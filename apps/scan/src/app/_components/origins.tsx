import { Globe } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Address, Addresses } from '@/components/ui/address';

import { Favicon } from '@/app/_components/favicon';

import { cn } from '@/lib/utils';

import type { ResourceOrigin } from '@prisma/client';
import type { MixedAddress } from '@/types/address';
import Link from 'next/link';

interface Props {
  addresses: MixedAddress[];
  origins: ResourceOrigin[];
  disableCopy?: boolean;
}

export const Origins: React.FC<Props> = ({
  origins,
  addresses,
  disableCopy,
}) => {
  if (!origins || origins.length === 0) {
    if (addresses.length === 0) {
      return null;
    }
    if (addresses.length === 1) {
      return <Address address={addresses[0]} disableCopy={disableCopy} />;
    }
    return <Addresses addresses={addresses} disableCopy={disableCopy} />;
  }

  if (origins.length === 1) {
    const origin = origins[0];
    return (
      <Link href={`/server/${origin.id}`} prefetch={false}>
        <OriginsContainer
          Icon={({ className }) => (
            <Favicon url={origin.favicon} className={className} />
          )}
          title={
            <span className="truncate">{new URL(origin.origin).hostname}</span>
          }
          address={
            addresses.length === 0 ? null : addresses.length === 1 ? (
              <Address address={addresses[0]} disableCopy={disableCopy} />
            ) : (
              <Addresses addresses={addresses} />
            )
          }
        />
      </Link>
    );
  }

  return (
    <OriginsContainer
      Icon={({ className }) => (
        <Favicon
          url={origins.find(origin => origin.favicon)?.favicon ?? null}
          className={className}
          Fallback={Globe}
        />
      )}
      title={
        <div className="flex items-center gap-2 overflow-hidden flex-1 w-0">
          <Link href={`/server/${origins[0].id}`} prefetch={false}>
            <span className="truncate">
              {new URL(origins[0].origin).hostname}
            </span>
          </Link>
          <Tooltip>
            <TooltipTrigger className="cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors text-xs font-mono shrink-0">
              +{origins.length - 1} more
            </TooltipTrigger>
            <TooltipContent className="max-w-sm flex flex-col gap-1">
              <p>
                Addresses can be associated with multiple servers.
                <br />
                This address is associated with the following servers:
              </p>
              <ul className="list-disc list-inside">
                {origins.slice(1).map(origin => (
                  <li key={origin.id}>
                    {origin.title ?? new URL(origin.origin).hostname}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      }
      address={
        addresses.length === 0 ? null : addresses.length === 1 ? (
          <Address address={addresses[0]} disableCopy={disableCopy} />
        ) : (
          <Addresses addresses={addresses} disableCopy={disableCopy} />
        )
      }
    />
  );
};

interface OriginProps {
  origin: ResourceOrigin;
  addresses: string[];
  disableCopy?: boolean;
}

export const Origin: React.FC<OriginProps> = ({
  origin,
  addresses,
  disableCopy,
}) => {
  return (
    <OriginsContainer
      Icon={({ className }) =>
        origin.favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={origin.favicon} alt="Favicon" className={className} />
        ) : (
          <Globe className={className} />
        )
      }
      title={new URL(origin.origin).hostname}
      address={
        <Addresses
          addresses={addresses}
          className="border-none p-0 text-[10px] md:text-xs"
          hideTooltip
          disableCopy={disableCopy}
        />
      }
    />
  );
};

export const OriginsSkeleton = () => {
  return (
    <OriginsContainer
      Icon={({ className }) => (
        <Skeleton className={cn('rounded-full', className)} />
      )}
      title={<Skeleton className="h-[14px] w-32 my-[3px]" />}
      address={<Skeleton className="h-3 w-20 my-[2px]" />}
    />
  );
};

interface OriginsContainerProps {
  Icon: ({ className }: { className: string }) => React.ReactNode;
  title: React.ReactNode;
  address: React.ReactNode;
}

const OriginsContainer = ({ Icon, title, address }: OriginsContainerProps) => {
  return (
    <div className="flex items-center gap-2 w-full overflow-hidden">
      <Icon className="size-6" />
      <div className="flex-1 overflow-hidden">
        <div className="text-xs md:text-sm font-mono font-semibold overflow-hidden text-ellipsis whitespace-nowrap w-full max-w-full flex">
          {title}
        </div>
        <div>{address}</div>
      </div>
    </div>
  );
};
