import Link from "next/link";
import { Send, Mail, CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RegisterResourceForm } from "./_components/form";
import { DiscoveryActions } from "./_components/discovery-actions";
import { ExpandableLink } from "./_components/expandable-link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add API",
  description: "Register your x402-compatible API on x402scan.",
};

export default function RegisterResourcePage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-2 py-8">
      <div className="space-y-1">
        <h1 className="type-page-title">Add your API</h1>
        <p className="type-supporting-body text-muted-foreground/80">
          List your API so agents can find and pay for it.
        </p>
      </div>
      <div className="space-y-4">
        <RegisterResourceForm />
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 type-caption text-muted-foreground sm:gap-x-3">
          <DiscoveryActions label="Set up x402 with a prompt" />
          <span className="hidden text-muted-foreground/40 sm:inline">·</span>
          <Link
            href="/discovery"
            className={buttonVariants({ variant: "quiet", size: "none" })}
          >
            Docs
          </Link>
          <span className="hidden text-muted-foreground/40 sm:inline">·</span>
          <ExpandableLink label="Support">
            <a
              href="https://t.me/+wj2U7LRDRGs5MTY6"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              <Send className="size-3.5" />
            </a>
            <a
              href="mailto:merchants@merit.systems"
              className="transition-colors hover:text-foreground"
            >
              <Mail className="size-3.5" />
            </a>
            <a
              href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1JmDUvMb4QVktX4PscRA66DEAQCLHLJKRKvwFogirtp9JZ0s5l-Vj96Nthl3M16qDPOprzsK6U"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              <CalendarDays className="size-3.5" />
            </a>
          </ExpandableLink>
        </div>
      </div>
    </main>
  );
}
