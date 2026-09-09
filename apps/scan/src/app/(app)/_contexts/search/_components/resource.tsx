import { Addresses } from "@/components/ui/address";
import { Favicon } from "@/app/(app)/_components/favicon";

import type {
  Accepts,
  ResourceOrigin,
  Resources,
} from "@x402scan/scan-db/types";

interface Props {
  resource: Resources & {
    accepts: Accepts[];
    origin: ResourceOrigin;
  };
}

export const Resource: React.FC<Props> = ({ resource }) => {
  return (
    <ResourceContainer
      icon={<Favicon url={resource.origin.favicon} className="size-6" />}
      title={`${new URL(resource.origin.origin).hostname}${decodeURIComponent(new URL(resource.resource).pathname)}`}
      address={
        <Addresses
          addresses={resource.accepts.map((accept) => accept.payTo)}
          hideTooltip
        />
      }
    />
  );
};

interface ResourceContainerProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  address: React.ReactNode;
}

const ResourceContainer = ({
  icon,
  title,
  address,
}: ResourceContainerProps) => {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <span className="type-compact-code">{title}</span>
        <div>{address}</div>
      </div>
    </div>
  );
};
