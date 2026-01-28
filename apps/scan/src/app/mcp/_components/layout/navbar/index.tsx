import React from 'react';

import Link from 'next/link';
import Image from 'next/image';

import { Book } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';

import { cn } from '@/lib/utils';

import type { Route } from 'next';

interface Props {
  className?: string;
}

export const Navbar: React.FC<Props> = ({ className }) => {
  return (
    <div className={cn('bg-card border-y w-full', className)}>
      <div className="flex w-full items-center justify-between px-6 py-3 container mx-auto">
        {/* Logo section */}
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-1 group">
            <Logo className="size-6" />
            <h1 className="font-semibold font-mono hidden md:block group-hover:text-primary transition-colors">
              x402scan
            </h1>
          </Link>
          <p className={cn('text-muted-foreground/20 text-xl')}>/</p>
          <Link href="/mcp" className="flex items-center gap-1 group">
            <h1 className="font-semibold font-mono hidden md:block group-hover:text-primary transition-colors">
              MCP
            </h1>
          </Link>
        </div>

        {/* Actions - adaptive sizing */}
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://github.com/Merit-Systems/x402scan"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <Button variant="outline" size="icon" className="md:rounded-xl">
              <Image
                src="/github.png"
                alt="GitHub"
                width={16}
                height={16}
                className="size-4 dark:invert"
              />
            </Button>
          </a>
          <AnimatedThemeToggler className="md:rounded-xl" />
          <Link href={'/mcp/guide' as Route<'/mcp/guide'>}>
            <Button className="md:rounded-xl">
              <Book className="size-4" />
              Learn
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
