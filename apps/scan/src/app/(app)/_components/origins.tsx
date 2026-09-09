import { Globe } from "lucide-react";

import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Address, Addresses } from "@/components/ui/address";

import { Favicon } from "@/app/(app)/_components/favicon";
import { cleanExternalText } from "@/lib/utils";

import type { ResourceOrigin } from "@x402scan/scan-db/types";
import type { MixedAddress } from "@/types/address";

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
      return <Address address={addresses[0]!} disableCopy={disableCopy} />;
    }
    return <Addresses addresses={addresses} disableCopy={disableCopy} />;
  }

  if (origins.length === 1) {
    const origin = origins[0];
    return (
      <Link href={`/server/${origin!.id}`}>
        <OriginsContainer
          Icon={({ className }) => (
            <Favicon url={origin!.favicon} className={className} />
          )}
          title={
            <span className="truncate">{new URL(origin!.origin).hostname}</span>
          }
          address={
            addresses.length === 0 ? null : addresses.length === 1 ? (
              <Address address={addresses[0]!} disableCopy={disableCopy} />
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
          url={origins.find((origin) => origin.favicon)?.favicon ?? null}
          className={className}
          Fallback={Globe}
        />
      )}
      title={
        <>
          <Link href={`/server/${origins[0]!.id}`}>
            <span className="truncate">
              {new URL(origins[0]!.origin).hostname}
            </span>
          </Link>
          <Tooltip>
            <TooltipTrigger className="shrink-0 cursor-pointer rounded-md font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              +{origins.length - 1} more
            </TooltipTrigger>
            <TooltipContent className="flex max-w-sm flex-col gap-1">
              <p>
                Addresses can be associated with multiple servers.
                <br />
                This address is associated with the following servers:
              </p>
              <ul className="list-inside list-disc">
                {origins.slice(1).map((origin) => (
                  <li key={origin.id}>
                    {origin.title
                      ? cleanExternalText(origin.title)
                      : new URL(origin.origin).hostname}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </>
      }
      address={
        addresses.length === 0 ? null : addresses.length === 1 ? (
          <Address address={addresses[0]!} disableCopy={disableCopy} />
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
      Icon={({ className }) => (
        <Favicon url={origin.favicon} className={className} />
      )}
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

interface OriginsContainerProps {
  Icon: ({ className }: { className: string }) => React.ReactNode;
  title: React.ReactNode;
  address: React.ReactNode;
}

const OriginsContainer = ({ Icon, title, address }: OriginsContainerProps) => {
  return (
    <div className="flex w-full items-center gap-2 overflow-hidden">
      <Icon className="size-6" />
      <div className="flex-1 overflow-hidden">
        <div className="flex w-full max-w-full items-center gap-2 overflow-hidden font-mono text-xs font-semibold text-ellipsis whitespace-nowrap md:text-sm">
          {title}
        </div>
        <div>{address}</div>
      </div>
    </div>
  );
};
