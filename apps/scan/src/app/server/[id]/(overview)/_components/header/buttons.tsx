'use client';

import { Bot, MessagesSquare } from 'lucide-react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/client';
import { clientCookieUtils } from '@/app/composer/(chat)/chat/_lib/cookies/client';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

export const HeaderButtons: React.FC<Props> = ({ origin }) => {
  const [[originWithResources]] =
    api.public.origins.list.withResources.useSuspenseQuery({
      originIds: [origin.id],
    });

  const router = useRouter();

  const onTryInChat = () => {
    clientCookieUtils.setResources(
      originWithResources?.resources.map(resource => ({
        id: resource.id,
        favicon: origin.favicon,
      }))
    );
    router.push(`/composer/chat`);
  };

  if (originWithResources?.resources.length > 0) {
    return (
      <ButtonsContainer>
        <Button variant="turbo" onClick={onTryInChat}>
          <MessagesSquare className="size-4" />
          Try in Chat
        </Button>
        <Link
          href={{
            pathname: '/composer/agents/new',
            query: {
              resources:
                originWithResources?.resources.map(resource => resource.id) ??
                [],
            },
          }}
          prefetch={false}
        >
          <Button variant="outline">
            <Bot className="size-4" />
            Create Agent
          </Button>
        </Link>
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
