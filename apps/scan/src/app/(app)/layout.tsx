import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';

import { LogoContainer } from './_components/layout/logo';
import { NavbarSearchButton } from './_components/layout/navbar/search';
import { NavbarAuthButton } from './_components/layout/navbar/auth-button';

import { SearchProvider } from './_contexts/search/provider';
import { ChainProvider } from './_contexts/chain/provider';
import { SolanaWalletProvider } from './_contexts/solana/provider';

import { ChainSelector } from './_components/layout/navbar/chain-selector';

import { connection } from 'next/server';

export default async function RootLayout({
  children,
  breadcrumbs,
}: LayoutProps<'/'>) {
  await connection();
  return (
    <ChainProvider>
      <SearchProvider>
        <SolanaWalletProvider>
          <LogoContainer>
            <Link href="/">
              <Logo className="size-full aspect-square" />
            </Link>
          </LogoContainer>
          <header className="w-full flex flex-col pt-4 justify-center bg-card">
            <div className="flex items-center justify-between w-full px-2 md:px-6 pb-0 md:pb-0 h-10">
              <div className="pl-8 md:pl-8 flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                {breadcrumbs}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <ChainSelector />
                <NavbarSearchButton />
                <NavbarAuthButton />
                <a
                  href="https://github.com/Merit-Systems/x402scan"
                  target="_blank"
                  rel="noreferrer"
                >
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
          <div className="bg-background flex-1 flex flex-col">{children}</div>
        </SolanaWalletProvider>
      </SearchProvider>
    </ChainProvider>
  );
}
