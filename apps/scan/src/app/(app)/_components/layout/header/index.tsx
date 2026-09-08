import { Suspense } from "react";
import { ChainSelector } from "../navbar/chain-selector";
import { GlobalSearch } from "../navbar/search";
import { HeaderBrand } from "./brand";
import { PrimaryNavigation } from "./navigation";
import { RegisterButton } from "./register-button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 w-full items-center gap-3 px-4">
        <HeaderBrand />

        <Suspense>
          <PrimaryNavigation className="hidden md:block" />
        </Suspense>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Suspense>
            <GlobalSearch />
          </Suspense>
          <div className="hidden h-5 border-l sm:block" />
          <Suspense>
            <ChainSelector />
          </Suspense>
          <ThemeToggle />
          <Suspense>
            <RegisterButton />
          </Suspense>
        </div>
      </div>

      <div className="no-scrollbar overflow-x-auto border-t px-2 py-1 md:hidden">
        <Suspense>
          <PrimaryNavigation />
        </Suspense>
      </div>
    </header>
  );
}
