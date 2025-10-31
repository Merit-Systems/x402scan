'use client';

import { cn } from '@/lib/utils';
import { type ComponentProps, memo } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-4',
        className
      )}
      shikiTheme={['github-light', 'github-dark']}
      components={{
        h1({ children }) {
          return (
            <h1 className={cn('text-xl font-bold md:text-2xl')}>{children}</h1>
          );
        },
        h2({ children }) {
          return (
            <h2 className={cn('text-lg font-bold md:text-xl')}>{children}</h2>
          );
        },
        h3({ children }) {
          return (
            <h3 className={cn('text-md font-bold md:text-lg')}>{children}</h3>
          );
        },
        h4({ children }) {
          return (
            <h4 className={cn('md:text-md text-sm font-bold')}>{children}</h4>
          );
        },
        h5({ children }) {
          return (
            <h5 className={cn('text-xs font-bold md:text-sm')}>{children}</h5>
          );
        },
        h6({ children }) {
          return <h6 className={cn('text-xs font-bold')}>{children}</h6>;
        },
        p({ children, node }) {
          const hasBlockElements = node?.children?.some(
            child =>
              'type' in child &&
              child.type === 'element' &&
              'tagName' in child &&
              ['div', 'p', 'blockquote', 'form'].includes(child.tagName)
          );

          if (hasBlockElements) {
            return <div className="text-xs md:text-sm">{children}</div>;
          }

          return <p className="text-xs md:text-sm">{children}</p>;
        },
        ol({ children }) {
          return (
            <ol className="flex list-decimal flex-col pl-4 text-xs md:text-sm space-y-2 marker:text-xs md:marker:text-sm">
              {children}
            </ol>
          );
        },
        ul({ children }) {
          return (
            <ul className="flex list-disc flex-col pl-4 text-xs md:text-sm space-y-2 marker:text-xs md:marker:text-sm">
              {children}
            </ul>
          );
        },
        li({ children }) {
          return (
            <li className="ml-2 space-y-2 text-xs md:text-sm">{children}</li>
          );
        },
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
