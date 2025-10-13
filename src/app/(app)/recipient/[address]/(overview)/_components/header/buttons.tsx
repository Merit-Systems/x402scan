import { TestTubeDiagonal } from 'lucide-react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { AddResourcesDialog } from '@/app/(app)/_components/add-resources';

interface Props {
  hasOrigins: boolean;
  address: string;
}

export const HeaderButtons: React.FC<Props> = ({ hasOrigins, address }) => {
  return (
    <ButtonsContainer>
      {hasOrigins && (
        <Link href={`/recipient/${address}/resources`} prefetch={false}>
          <Button variant="turbo">
            <TestTubeDiagonal className="size-4" />
            Try Resources
          </Button>
        </Link>
      )}
      <AddResourcesDialog />
    </ButtonsContainer>
  );
};

export const LoadingHeaderButtons = () => {
  return (
    <ButtonsContainer>
      <Skeleton className="h-8 md:h-9 w-24" />
    </ButtonsContainer>
  );
};

const ButtonsContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-row gap-2">{children}</div>;
};
