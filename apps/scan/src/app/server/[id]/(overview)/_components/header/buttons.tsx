'use client';

import { Bot, MessagesSquare } from 'lucide-react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/client';
import { clientCookieUtils } from '@/app/composer/(chat)/chat/_lib/cookies/client';

import type { RouterOutputs } from '@/trpc/client';
import { Chain } from '@/types/chain';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

export const HeaderButtons: React.FC<Props> = ({ origin }) => {
  const [[originWithResources]] =
    api.public.origins.list.withResources.useSuspenseQuery({
      originIds: [origin.id],
    });

  const router = useRouter();

  const baseResources = originWithResources?.resources
    .filter(resource =>
      resource.accepts.some(accept => accept.network === Chain.BASE.toString())
    )
    .map(resource => ({
      id: resource.id,
      favicon: origin.favicon,
    }));

  const onTryInChat = () => {
    clientCookieUtils.setResources(baseResources);
    router.push(`/composer/chat`);
  };

  const NoBaseResourcesTooltip = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <p>Composer currently only supports Base</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const tryInChatButton = (
    <Button
      variant="turbo"
      onClick={baseResources.length === 0 ? undefined : onTryInChat}
      className={cn(
        baseResources.length === 0 &&
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
        baseResources.length === 0 &&
          'opacity-50 cursor-not-allowed hover:opacity-50'
      )}
    >
      <Bot className="size-4" />
      Create Agent
    </Button>
  );

  if (originWithResources?.resources.length > 0) {
    return (
      <ButtonsContainer>
        {baseResources.length === 0 ? (
          <NoBaseResourcesTooltip>{tryInChatButton}</NoBaseResourcesTooltip>
        ) : (
          tryInChatButton
        )}
        {baseResources.length === 0 ? (
          <NoBaseResourcesTooltip>{createAgentButton}</NoBaseResourcesTooltip>
        ) : (
          <Link
            href={{
              pathname: '/composer/agents/new',
              query: {
                resources: baseResources.map(resource => resource.id) ?? [],
              },
            }}
            prefetch={false}
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
      <Link href={`/composer/chat`} prefetch={false}>
        <Button variant="turbo">
          <MessagesSquare className="size-4" />
          Try in Chat
        </Button>
      </Link>
      <Link href={`/resources/register`} prefetch={false}>
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
