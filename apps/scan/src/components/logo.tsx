import Image from 'next/image';
import React from 'react';

import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
  priority?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;
export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, containerClassName, onClick, priority, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={containerClassName}
        {...props}
      >
        <Image
          src="/logo.svg"
          alt="x402scan Logo"
          width={200}
          height={200}
          className={cn('size-6', className)}
          priority={priority}
        />
      </div>
    );
  }
);

Logo.displayName = 'Logo';
