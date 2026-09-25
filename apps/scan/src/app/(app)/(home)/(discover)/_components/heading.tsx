import Link from "next/link";

import { Plus } from "lucide-react";

import { HeadingContainer } from "../../../../_components/layout/page-utils";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

import { DiscoverSearchInput, DiscoverSearchSubmit } from "./discover-search";

export const DiscoverHeading = () => {
  return (
    <HeadingContainer className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Logo className="size-8" />
            <h1 className="font-mono text-2xl font-bold md:text-4xl">
              x402scan
            </h1>
          </div>
          <Link href="/resources/register" className="hidden shrink-0 md:block">
            <Button size="sm" className="h-9">
              <Plus className="size-4" />
              Add your API
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          The x402 block explorer, analytics dashboard and marketplace for paid
          APIs and agentic commerce
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 md:flex-row">
        <DiscoverSearchInput />
        <DiscoverSearchSubmit />
      </div>
      <Link href="/resources/register" className="md:hidden">
        <Button size="sm" className="h-9 w-full">
          <Plus className="size-4" />
          Add your API
        </Button>
      </Link>
    </HeadingContainer>
  );
};
