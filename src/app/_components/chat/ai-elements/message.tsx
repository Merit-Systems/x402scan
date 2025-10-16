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
      'group flex w-full items-end justify-end gap-2 py-4',
      from === 'user' ? 'is-user' : 'is-assistant flex-row-reverse justify-end',
      '[&>div]:max-w-[80%]',
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
      'flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm',
      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
      'group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground',
      'is-user:dark',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export { Message, MessageContent };
