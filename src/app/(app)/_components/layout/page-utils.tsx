import React from 'react';

import { Separator } from '@/components/ui/separator';

import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

interface HeadingProps {
  title: string | ReactNode;
  icon?: ReactNode;
  description?: string | ReactNode;
  actions?: ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  icon,
  title,
  description,
  actions,
}) => {
  return (
    <HeadingContainer className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4 shrink-0 flex-1">
        {icon}
        <div className="flex flex-col gap-1 md:gap-3 text-left">
          {typeof title === 'string' ? (
            <h1 className="text-2xl md:text-4xl font-bold font-mono">
              {title}
            </h1>
          ) : (
            title
          )}
          {description &&
            (typeof description === 'string' ? (
              <p className="text-muted-foreground/80 text-sm md:text-base">
                {description}
              </p>
            ) : (
              description
            ))}
        </div>
      </div>
      {actions}
    </HeadingContainer>
  );
};

export const HeadingContainer = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div
        className={cn(
          'max-w-full md:max-w-6xl w-full px-2 pb-6 md:pb-8 mx-auto',
          className
        )}
      >
        {children}
      </div>
      <Separator />
    </>
  );
};

interface BodyProps {
  children: ReactNode;
  className?: string;
}

export const Body: React.FC<BodyProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-8 max-w-6xl w-full mx-auto py-8 px-2',
        className
      )}
    >
      {children}
    </div>
  );
};
