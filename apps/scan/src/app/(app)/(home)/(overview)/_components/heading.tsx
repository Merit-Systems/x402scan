"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Plus, Search, X } from "lucide-react";

import { HeadingContainer } from "../../../../_components/layout/page-utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

import { InlineSearchSuggestions } from "@/app/(app)/_components/search/inline-search-suggestions";

export const HomeHeading = () => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // The /all page has no body slot for full results, so submitting from here
  // hands off to the discover page (which renders the full search results
  // table inline).
  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  };

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
          The x402 analytics dashboard and block explorer
        </p>
      </div>
      <div
        className="relative w-full"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsFocused(false);
          }
        }}
        onFocus={() => setIsFocused(true)}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape" && input) {
              e.preventDefault();
              setInput("");
            }
          }}
          placeholder="Try: send email, generate image, search the web, buy a mug…"
          className="h-11 bg-transparent pr-9 pl-9"
          autoComplete="off"
          name="home-search"
          type="text"
        />
        {input ? (
          <button
            type="button"
            className="absolute top-1/2 right-3 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setInput("")}
          >
            <X className="size-4" />
          </button>
        ) : null}
        <InlineSearchSuggestions
          input={input}
          enabled={isFocused}
          onSubmit={submit}
        />
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
