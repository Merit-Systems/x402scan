'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Plus, Search, X } from 'lucide-react';

import { HeadingContainer } from '../../../../_components/layout/page-utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';

import { X402V2Badge } from '@/app/(app)/_components/x402/v2-badge';

import { InlineSearchSuggestions } from '@/app/(app)/_components/search/inline-search-suggestions';

export const HomeHeading = () => {
  const router = useRouter();
  const [input, setInput] = useState('');
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
        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <h1 className="text-2xl md:text-4xl font-bold font-mono">x402scan</h1>
          <X402V2Badge className="mt-1 text-sm" />
        </div>
        <p className="text-muted-foreground text-sm">
          The x402 analytics dashboard and block explorer
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div
          className="relative w-full md:flex-1"
          onBlur={event => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              setIsFocused(false);
            }
          }}
          onFocus={() => setIsFocused(true)}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
              if (e.key === 'Escape' && input) {
                e.preventDefault();
                setInput('');
              }
            }}
            placeholder='Search any agent capability. e.g. "send an email", "generate an image", "search the web", "buy a mug"...'
            className="pl-9 pr-9 h-11 bg-transparent"
            autoComplete="off"
            name="home-search"
            type="text"
          />
          {input ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              onClick={() => setInput('')}
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
        <Link
          href="/resources/register"
          className="w-full md:w-fit hidden md:block"
        >
          <Button
            variant="outline"
            className="h-11 w-full shrink-0 px-4 md:w-fit"
            size="lg"
          >
            <Plus className="size-4" />
            Register Resource
          </Button>
        </Link>
      </div>
    </HeadingContainer>
  );
};
