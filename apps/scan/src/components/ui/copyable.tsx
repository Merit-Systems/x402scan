'use client';

import React from 'react';
import { toast } from 'sonner';

interface CopyableProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
  toastMessage?: string;
}

export const Copyable: React.FC<CopyableProps> = ({
  value,
  children,
  className,
  toastMessage = 'Copied to clipboard',
}) => {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      toast.success(toastMessage);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <span
      onClick={handleCopy}
      className={className}
      style={{ cursor: 'pointer' }}
      tabIndex={0}
      role="button"
      aria-label="Copy to clipboard"
    >
      {children ?? value}
    </span>
  );
};
