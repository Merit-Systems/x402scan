'use client';

import {
  OriginResources as OriginResourcesComponent,
  LoadingOriginResources as LoadingOriginResourcesComponent,
} from '@/app/(app)/_components/resources/origin-resources';

import { api } from '@/trpc/client';
import { OriginOverviewSection } from './section';
import { CopyCode } from '@/components/ui/copy-code';
import { Terminal } from 'lucide-react';

interface Props {
  originId: string;
  originUrl: string;
}

export const OriginResources: React.FC<Props> = ({ originId, originUrl }) => {
  const [[origin]] = api.public.origins.list.withResources.useSuspenseQuery({
    originIds: [originId],
  });

  return (
    <div className="flex flex-col gap-8">
      <OriginOverviewSection title="Resources" className="gap-0">
        <OriginResourcesComponent
          resources={origin?.resources ?? []}
          defaultOpen={false}
          hideOrigin
          isFlat
        />
      </OriginOverviewSection>
      <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Try in agentcash</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Use the agentcash CLI to discover and call this API with USDC micropayments.
        </p>
        <CopyCode
          code={`npx agentcash try ${originUrl}`}
          toastMessage="Command copied!"
        />
      </div>
    </div>
  );
};

export const LoadingOriginResources = () => {
  return (
    <OriginOverviewSection title="Resources" className="gap-0">
      <LoadingOriginResourcesComponent />
    </OriginOverviewSection>
  );
};
