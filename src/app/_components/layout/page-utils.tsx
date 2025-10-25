import React from 'react';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Separator } from '@/components/ui/separator';

import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';
import type { Route } from 'next';

interface HeadingProps {
  title: string | ReactNode;
  icon?: ReactNode;
  description?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  icon,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <HeadingContainer
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4',
        className
      )}
    >
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

interface SectionProps<T extends string> {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  href?: Route<T>;
}

export const Section = <T extends string>({
  children,
  title,
  actions,
  description,
  className,
  href,
}: SectionProps<T>) => {
  const Header = () => {
    return (
      <div
        className={cn(
          'flex items-center gap-1',
          href && 'group cursor-pointer'
        )}
      >
        <h1 className="font-bold text-xl md:text-2xl">{title}</h1>
        {href && (
          <div className="flex items-center gap-2 bg-muted/0 hover:bg-muted rounded-md p-0.5 transition-all hover:scale-105 group-hover:translate-x-1">
            <ChevronRight className="size-4 text-foreground/60 group-hover:text-muted-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col gap-4 md:gap-6', className)}>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          {href ? (
            <Link href={href} prefetch={false}>
              <Header />
            </Link>
          ) : (
            <Header />
          )}
          {actions}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};
