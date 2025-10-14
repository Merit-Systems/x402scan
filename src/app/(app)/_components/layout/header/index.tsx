import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';

import { LogoContainer } from './logo';
import { NavbarSearchButton } from './search';
import { NavbarAuthButton } from './auth-button';
import { Book } from 'lucide-react';
import type { Route } from 'next';

interface Props {
  breadcrumbs: React.ReactNode;
}

export const Header: React.FC<Props> = ({ breadcrumbs }) => {
  return (
    <>
      <LogoContainer>
        <Link href="/" prefetch={false}>
          <Logo className="size-full aspect-square" />
        </Link>
      </LogoContainer>
      <header className="w-full flex flex-col pt-4 justify-center bg-card">
        <div className="flex items-center justify-between w-full px-2 md:px-6 pb-0 md:pb-0 h-10">
          <div className="pl-8 md:pl-8 flex items-center gap-2 md:gap-3">
            {breadcrumbs}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <NavbarSearchButton />
            <NavbarAuthButton />
            <Link href={'/docs' as Route} prefetch={false}>
              <Button variant="outline" size={'icon'}>
                <Book className="size-4" />
              </Button>
            </Link>
            <a href="https://github.com/Merit-Systems/x402scan" target="_blank">
              <Button variant="outline" size={'icon'}>
                <Image
                  src="/github.png"
                  alt="GitHub"
                  width={16}
                  height={16}
                  className="size-4 dark:invert"
                />
              </Button>
            </a>
            <AnimatedThemeToggler />
          </div>
        </div>
      </header>
    </>
  );
};
