"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Shortcut } from "@/components/ui/shortcut";

import { useSearch } from "@/app/(app)/_contexts/search/hook";

export const NavbarSearchButton = () => {
  const { setIsOpen } = useSearch();

  return (
    <Button
      size="default"
      variant="outline"
      aria-label="Search x402scan"
      className="w-8 lg:w-48 lg:justify-between"
      onClick={() => {
        setIsOpen(true);
      }}
    >
      <div className="flex items-center gap-2">
        <Search className="size-4" />
        <span className="hidden lg:block">Search...</span>
      </div>
      <Shortcut className="hidden lg:block">⌘K</Shortcut>
    </Button>
  );
};
