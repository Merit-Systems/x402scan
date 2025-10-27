import React, { Suspense } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { auth } from '@/auth';

import type { RouterOutputs } from '@/trpc/client';
import { MessageSquare, Pencil } from 'lucide-react';

interface Props {
  agentConfiguration: NonNullable<RouterOutputs['public']['agents']['get']>;
}

export const HeaderButtons: React.FC<Props> = async ({
  agentConfiguration,
}) => {
  return (
    <ButtonsContainer>
      <Link href={`/composer/agent/${agentConfiguration.id}/chat`}>
        <Button variant="turbo">
          <MessageSquare className="size-4" />
          Use Agent
        </Button>
      </Link>
      <Suspense>
        <EditButton agentConfiguration={agentConfiguration} />
      </Suspense>
    </ButtonsContainer>
  );
};

const EditButton: React.FC<Props> = async ({ agentConfiguration }) => {
  const session = await auth();

  if (session?.user.id !== agentConfiguration.ownerId) {
    return null;
  }

  return (
    <Link href={`/composer/agent/${agentConfiguration.id}/edit`}>
      <Button variant="outline">
        <Pencil className="size-4" />
        Edit
      </Button>
    </Link>
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
