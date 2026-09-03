import Link from "next/link";
import { ArrowRight, BookOpen, Rocket, Workflow } from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

export function DiscoverySubpageCards() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3" data-not-typeset>
      {subPages.map((subPage) => {
        const Icon = subPage.icon;
        return (
          <Link
            key={subPage.href}
            href={subPage.href}
            className="group flex flex-col gap-3 rounded-md border bg-card p-5 transition-colors hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Icon size={18} />
            </div>
            <h3 className="type-card-title">{subPage.title}</h3>
            <p className="type-supporting-body flex-1 text-muted-foreground">
              {subPage.description}
            </p>
            <span className="inline-flex items-center gap-1 type-label text-primary">
              {subPage.cta}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

interface DiscoverySubPage {
  href: Route;
  title: string;
  description: string;
  icon: LucideIcon;
  cta: string;
}

const subPages: DiscoverySubPage[] = [
  {
    href: "/discovery/quickstart",
    title: "Quickstart with your agent",
    description:
      "Copy a prompt into your coding agent and it handles the rest. The fastest path for most providers.",
    icon: Rocket,
    cta: "Start quickstart",
  },
  {
    href: "/discovery/spec",
    title: "Discovery spec reference",
    description:
      "OpenAPI requirements, SIWX routes, endpoint fallback, and common failure reasons.",
    icon: BookOpen,
    cta: "Read the spec",
  },
  {
    href: "/discovery/architecture",
    title: "Suggested architecture",
    description:
      "Proxy architecture for wrapping existing APIs without touching your production backend.",
    icon: Workflow,
    cta: "See the pattern",
  },
];
