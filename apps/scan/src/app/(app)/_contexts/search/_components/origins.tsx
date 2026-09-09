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
      icon={<Favicon url={origin.favicon} className="size-6" />}
      title={new URL(origin.origin).hostname}
      address={
        <Addresses
          addresses={addresses}
          hideTooltip
          disableCopy={disableCopy}
        />
      }
    />
  );
};

interface OriginsContainerProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  address: React.ReactNode;
}

const OriginsContainer = ({ icon, title, address }: OriginsContainerProps) => {
  return (
    <div className="flex w-full items-center gap-2 overflow-hidden">
      {icon}
      <div className="flex-1 overflow-hidden">
        <span className="type-compact-code flex w-full max-w-full items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </span>
        <div>{address}</div>
      </div>
    </div>
  );
};
