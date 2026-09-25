"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/ui/logo";

export function HeaderBrand() {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      aria-label="x402scan home"
      className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
    >
      <Logo className="size-5 md:size-6" />
      {pathname === "/" ? null : (
        <span className="hidden type-label lg:inline">x402scan</span>
      )}
    </Link>
  );
}
