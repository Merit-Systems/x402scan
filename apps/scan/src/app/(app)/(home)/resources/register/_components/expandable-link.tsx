'use client';

import { useState } from 'react';

export function ExpandableLink({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex flex-col items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(prev => !prev)}
        className="cursor-default hover:text-foreground transition-colors"
      >
        {label}
      </button>
      {open && (
        <span className="absolute top-full pt-1 flex flex-col items-center">
          <span className="flex items-center gap-3 rounded-md border bg-background px-3 py-1.5 shadow-sm whitespace-nowrap">
            {children}
          </span>
        </span>
      )}
    </span>
  );
}
