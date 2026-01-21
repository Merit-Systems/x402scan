import React from 'react';

import Link from 'next/link';
import Image from 'next/image';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';

import { NavbarContainer } from './container';

interface Props {
  hideLinks?: boolean;
}

export const Navbar: React.FC<Props> = () => {
  return (
    <NavbarContainer>
      <div className="flex w-full items-center justify-between">
        {/* Logo section */}
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-6" />
            <h1 className="font-bold font-mono hidden md:block">x402scan</h1>
          </Link>
        </div>

        {/* Actions - adaptive sizing */}
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://github.com/Merit-Systems/x402scan"
            target="_blank"
            rel="noreferrer"
          >
            <a
              href="https://github.com/merit-systems/x402scan"
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
                  className="size-4"
                />
              </Button>
            </a>
          </a>
          <AnimatedThemeToggler className="md:rounded-xl" />
        </div>
      </div>
    </NavbarContainer>
  );
};
