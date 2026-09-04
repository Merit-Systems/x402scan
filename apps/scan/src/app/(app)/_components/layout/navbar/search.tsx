"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Shortcut } from "@/components/ui/shortcut";

import { useSearch } from "@/app/(app)/_contexts/search/hook";

export const NavbarSearchButton = () => {
  const { setIsOpen } = useSearch();

  return (
    <Button
      size="icon"
      variant="outline"
      aria-label="Search x402scan"
      className="text-muted-foreground lg:w-48 lg:justify-between lg:px-2 lg:pr-1"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      <div className="flex items-center gap-2">
        <Search className="size-4" />
        <span className="hidden lg:block">Search...</span>
      </div>
      <Shortcut className="hidden rounded-md bg-muted px-1 lg:block">
        ⌘K
      </Shortcut>
    </Button>
  );
};
