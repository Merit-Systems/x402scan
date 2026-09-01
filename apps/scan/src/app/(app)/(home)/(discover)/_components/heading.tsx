import Link from "next/link";

import { BookOpen, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

import { DiscoverSearchInput, DiscoverSearchSubmit } from "./discover-search";

export const DiscoverHeading = () => {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Logo className="size-10" />
            <h1 className="type-product-title">x402scan</h1>
          </div>
          <p className="max-w-xl text-muted-foreground">
            Explore services, activity, and infrastructure across the x402
            economy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/resources/register"
            className={buttonVariants({ size: "lg" })}
          >
            <Plus className="size-3.5" />
            Add your API
          </Link>
          <Link
            href="/discovery"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            <BookOpen className="size-3.5" />
            Read the docs
          </Link>
        </div>
      </div>
      <div className="flex max-w-2xl flex-col items-center gap-2 md:flex-row">
        <DiscoverSearchInput />
        <DiscoverSearchSubmit />
      </div>
    </section>
  );
};
