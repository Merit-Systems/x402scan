"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Shortcut } from "@/components/ui/shortcut";

import { useSearch } from "@/app/(app)/_contexts/search/hook";

export const NavbarSearchButton = () => {
  const { setIsOpen } = useSearch();

  return (
    <Button
      size="navbar"
      variant="outline"
      className="flex items-center gap-0 text-muted-foreground md:justify-between md:gap-16 md:px-2 md:pr-1"
      onClick={() => setIsOpen(true)}
    >
      <div className="flex items-center gap-0 text-sm md:gap-2">
        <Search className="size-4" />
        <span className="hidden md:block">Navigate</span>
      </div>
      <Shortcut className="hidden rounded-md bg-muted px-1 md:block">
        ⌘K
      </Shortcut>
    </Button>
  );
};
