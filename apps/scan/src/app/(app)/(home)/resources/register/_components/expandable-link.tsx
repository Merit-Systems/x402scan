'use client';

import { useEffect, useRef, useState } from 'react';

export function ExpandableLink({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <span
      ref={ref}
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
