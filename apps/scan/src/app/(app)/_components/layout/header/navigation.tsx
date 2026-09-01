"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { Route } from "next";

interface NavigationItem<T extends string = string> {
  label: string;
  href: Route<T>;
  relatedRoutes?: readonly string[];
}

const navigationItems = [
  {
    label: "Discover",
    href: "/",
    relatedRoutes: ["/server/", "/resources/"],
  },
  {
    label: "Activity",
    href: "/all",
    relatedRoutes: ["/buyer/", "/recipient/"],
  },
  {
    label: "Facilitators",
    href: "/facilitators",
    relatedRoutes: ["/facilitator/"],
  },
  { label: "Networks", href: "/networks" },
  {
    label: "Docs",
    href: "/discovery",
    relatedRoutes: [
      "/discovery/",
      "/integration-spec",
      "/x402",
      "/agentic-commerce",
    ],
  },
] satisfies readonly NavigationItem[];

export function PrimaryNavigation({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className={className}>
      <ul className="flex min-w-max items-center gap-1">
        {navigationItems.map((item) => {
          const isCurrent =
            pathname === item.href ||
            item.relatedRoutes?.some((route) => pathname.startsWith(route));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "block rounded-md px-2 py-1.5 type-label text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCurrent && "text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
