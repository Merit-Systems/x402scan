'use client';

import { ArrowDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Conversation = ({
  className,
  ...props
}: ComponentProps<typeof StickToBottom>) => (
  <StickToBottom
    className={cn('relative h-full overflow-y-scroll no-scrollbar', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

const ConversationContent = ({
  className,
  ...props
}: ComponentProps<typeof StickToBottom.Content>) => (
  <StickToBottom.Content className={cn('p-4', className)} {...props} />
);

const ConversationEmptyState = ({
  className,
  title = 'No messages yet',
  description = 'Start a conversation to see messages here',
  icon,
  children,
  ...props
}: ComponentProps<'div'> & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) => (
  <div
    className={cn(
      'flex size-full flex-col items-center justify-center gap-4 p-8 text-center',
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-2">
          <h3 className="font-bold text-2xl">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm font-mono max-w-xs">
              {description}
            </p>
          )}
        </div>
      </>
    )}
  </div>
);

const ConversationScrollButton = ({
  className,
  ...props
}: ComponentProps<typeof Button>) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(async () => {
    await scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn(
          'absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full',
          className
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
};

export {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
};
