import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export function HeaderBrand() {
  return (
    <Link
      href="/"
      aria-label="x402scan home"
      className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
    >
      <Logo className="size-5 md:size-6" />
    </Link>
  );
}
