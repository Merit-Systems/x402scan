import type { UIMessage } from 'ai';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Message = ({
  className,
  from,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
}) => (
  <div
    className={cn(
      'group flex flex-col w-full items-end gap-4 py-2 md:py-4',
      from === 'user' ? 'is-user' : 'is-assistant items-start',
      '[&>div]:max-w-[100%] md:[&>div]:max-w-[80%]',
      className
    )}
    {...props}
  />
);

const MessageContent = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-2 overflow-hidden rounded-lg text-foreground text-sm',
      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground group-[.is-user]:px-4 group-[.is-user]:py-3',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export { Message, MessageContent };
