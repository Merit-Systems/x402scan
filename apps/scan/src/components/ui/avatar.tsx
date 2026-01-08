import React from 'react';

import { User } from 'lucide-react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

interface Props {
  src: string | null | undefined;
  fallback?: React.ReactNode;
  className?: string;
}

export const Avatar: React.FC<Props> = ({ src, fallback, className }) => {
  return (
    <AvatarPrimitive.Avatar
      className={cn('rounded-md overflow-hidden bg-card', className)}
    >
      {src ? (
        <AvatarPrimitive.Image src={src} className="size-full" />
      ) : (
        <AvatarPrimitive.Image />
      )}
      <AvatarPrimitive.Fallback
        className={cn(
          'size-full flex items-center justify-center border rounded-md',
          className
        )}
      >
        {fallback ?? <User className="size-4" />}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Avatar>
  );
};
