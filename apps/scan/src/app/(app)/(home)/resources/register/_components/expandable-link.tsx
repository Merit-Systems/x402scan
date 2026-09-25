"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-flex flex-col items-center"
      onMouseEnter={() => {
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(false);
      }}
    >
      <Button
        type="button"
        variant="quiet"
        size="none"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
      >
        {label}
      </Button>
      {open && (
        <span className="absolute top-full flex flex-col items-center pt-1">
          <span className="flex items-center gap-3 rounded-md border bg-background px-3 py-1.5 whitespace-nowrap shadow-sm">
            {children}
          </span>
        </span>
      )}
    </span>
  );
}
