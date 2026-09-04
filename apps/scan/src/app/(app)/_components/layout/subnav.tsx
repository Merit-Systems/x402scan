"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Route } from "next";

interface Tab<T extends string> {
  label: string;
  href: Route<T>;
  subRoutes?: readonly string[];
  external?: boolean;
  isNew?: boolean;
}

interface SubnavProps<T extends string = string> {
  tabs: readonly Tab<T>[];
}

export function Subnav<T extends string>({ tabs }: SubnavProps<T>) {
  const pathname = usePathname();

  return (
    <div className="border-b bg-background">
      <nav
        aria-label="Section navigation"
        className="mx-auto no-scrollbar max-w-6xl overflow-x-auto px-2"
      >
        <ul className="flex min-w-max items-center gap-1 py-1.5">
          {tabs.map((tab) => {
            const isCurrent =
              pathname === tab.href ||
              tab.subRoutes?.some((route) => pathname.startsWith(route));

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 type-label text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isCurrent && "bg-muted text-foreground"
                  )}
                >
                  {tab.label}
                  {tab.external ? <ExternalLink className="size-3.5" /> : null}
                  {tab.isNew ? (
                    <span className="rounded-md bg-primary/10 px-1.5 type-caption text-primary">
                      New
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
