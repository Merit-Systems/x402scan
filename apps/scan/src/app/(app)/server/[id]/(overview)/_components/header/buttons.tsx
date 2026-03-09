'use client';

import { Bot, MessagesSquare } from 'lucide-react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/client';
import { clientCookieUtils } from '@/app/(app)/composer/(chat)/chat/_lib/cookies/client';

import type { RouterOutputs } from '@/trpc/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

const NoResourcesTooltip = ({ children }: { children: React.ReactNode }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>No resources for this server are compatible with Composer</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const HeaderButtons: React.FC<Props> = ({ origin }) => {
  const [[originWithResources]] =
    api.public.origins.list.withResources.useSuspenseQuery({
      originIds: [origin.id],
    });

  const router = useRouter();

  const resources =
    originWithResources?.resources.map(resource => ({
      id: resource.id,
      favicon: origin.favicon,
    })) ?? [];

  const onTryInChat = () => {
    clientCookieUtils.setResources(resources);
    router.push(`/composer/chat`);
  };

  const tryInChatButton = (
    <Button
      variant="turbo"
      onClick={resources.length === 0 ? undefined : onTryInChat}
      className={cn(
        resources.length === 0 &&
          'opacity-50 cursor-not-allowed hover:opacity-50'
      )}
    >
      <MessagesSquare className="size-4" />
      Try in Chat
    </Button>
  );

  const createAgentButton = (
    <Button
      variant="outline"
      className={cn(
        resources.length === 0 &&
          'opacity-50 cursor-not-allowed hover:opacity-50'
      )}
    >
      <Bot className="size-4" />
      Create Agent
    </Button>
  );

  if (
    originWithResources?.resources.length &&
    originWithResources.resources.length > 0
  ) {
    return (
      <ButtonsContainer>
        {resources.length === 0 ? (
          <NoResourcesTooltip>{tryInChatButton}</NoResourcesTooltip>
        ) : (
          tryInChatButton
        )}
        {resources.length === 0 ? (
          <NoResourcesTooltip>{createAgentButton}</NoResourcesTooltip>
        ) : (
          <Link
            href={{
              pathname: '/composer/agents/new',
              query: {
                resources: resources.map(resource => resource.id),
              },
            }}
          >
            {createAgentButton}
          </Link>
        )}
      </ButtonsContainer>
    );
  }

  return null;
};

export const LoadingHeaderButtons = () => {
  return (
    <ButtonsContainer>
      <Link href={`/composer/chat`}>
        <Button variant="turbo">
          <MessagesSquare className="size-4" />
          Try in Chat
        </Button>
      </Link>
      <Link href={`/resources/register`}>
        <Button variant="outline">
          <Bot className="size-4" />
          Create Agent
        </Button>
      </Link>
    </ButtonsContainer>
  );
};

const ButtonsContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-row gap-2">{children}</div>;
};
