import { Addresses } from "@/components/ui/address";

import { Favicon } from "@/app/(app)/_components/favicon";

import type { ResourceOrigin } from "@x402scan/scan-db/types";

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
