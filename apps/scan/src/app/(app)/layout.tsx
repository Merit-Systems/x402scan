import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

import { LogoContainer } from "./_components/layout/logo";
import { NavbarSearchButton } from "./_components/layout/navbar/search";
import { NavbarAuthButton } from "./_components/layout/navbar/auth-button";

import { SearchProvider } from "./_contexts/search/provider";
import { ChainProvider } from "./_contexts/chain/provider";

import { ChainSelector } from "./_components/layout/navbar/chain-selector";

export default function AppLayout({ children, breadcrumbs }: LayoutProps<"/">) {
  return (
    <ChainProvider>
      <SearchProvider>
        <LogoContainer>
          <Link href="/">
            <Logo className="aspect-square size-full" />
          </Link>
        </LogoContainer>
        <header className="flex w-full flex-col justify-center bg-card pt-4">
          <div className="flex h-10 w-full items-center justify-between px-2 pb-0 md:px-6 md:pb-0">
            <div className="flex min-w-0 flex-1 items-center gap-2 pl-8 md:gap-3 md:pl-8">
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
                <Button variant="outline" size={"icon"}>
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
        <div className="flex flex-1 flex-col bg-background">{children}</div>
      </SearchProvider>
    </ChainProvider>
  );
}
