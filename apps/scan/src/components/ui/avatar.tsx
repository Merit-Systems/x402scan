'use client';

import React, { useState } from 'react';

import { User } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface Props {
  src: string | null | undefined;
  fallback?: React.ReactNode;
  className?: string;
}

export const Avatar: React.FC<Props> = ({ src, fallback, className }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'rounded-md overflow-hidden bg-card flex items-center justify-center border',
          className
        )}
      >
        {fallback ?? <User className="size-4" />}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={64}
      height={64}
      unoptimized
      onError={() => setFailed(true)}
      className={cn('rounded-md object-cover', className)}
    />
  );
};
