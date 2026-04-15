import React from 'react';

import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';
import type { Route } from 'next';

interface Props<T extends string> {
  href: Route<T>;
  image: string | null;
  name: string;
  Fallback: LucideIcon | null;
  mobileHideText?: boolean;
  mobileHideImage?: boolean;
  disabled?: boolean;
  textClassName?: string;
  className?: string;
}

export const Breadcrumb = <T extends string>({
  href,
  image,
  name,
  Fallback,
  textClassName,
  mobileHideImage = false,
  mobileHideText = false,
  disabled = false,
  className,
}: Props<T>) => {
  return (
    <Link
      href={href}
      className={cn(disabled && 'pointer-events-none', className)}
      aria-disabled={disabled}
    >
      <div className="flex items-center gap-2 cursor-pointer min-w-0">
        {(Fallback !== null || image !== null) && (
          <Avatar
            className={cn(
              'rounded-md overflow-hidden bg-card size-5 shrink-0',
              mobileHideImage && 'hidden md:block'
            )}
          >
            {image ? (
              <AvatarImage src={image} className="size-full" />
            ) : (
              <AvatarImage />
            )}
            <AvatarFallback
              className={cn(
                'size-full flex items-center justify-center border rounded-md',
                'size-5'
              )}
            >
              {Fallback && <Fallback className="size-3" />}
            </AvatarFallback>
          </Avatar>
        )}

        <p
          className={cn(
            'font-semibold text-sm font-mono md:text-base truncate min-w-0',
            textClassName,
            mobileHideText && 'hidden md:block'
          )}
        >
          {name}
        </p>
      </div>
    </Link>
  );
};
