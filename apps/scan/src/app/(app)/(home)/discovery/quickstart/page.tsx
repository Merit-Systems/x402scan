import Link from "next/link";
import { Body, Heading } from "@/app/_components/layout/page-utils";
import { Button } from "@/components/ui/button";
import { TryDiscovery } from "../../integration-spec/try-discovery";
import { QuickstartPromptCard } from "./_components/prompt-card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quickstart",
  description:
    "Use an AI coding agent to make your API discoverable and payable.",
};

export default function QuickstartPage() {
  return (
    <div>
      <Heading
        title="Quickstart with your agent"
        description="Paste one prompt into your coding agent. It figures out where you are and walks you through everything."
      />
      <Body className="gap-10">
        <QuickstartPromptCard />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">When the agent finishes</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Your <code>/openapi.json</code> should describe each payable route
              with <code>x-payment-info</code> and a <code>402</code> response.
            </li>
            <li>
              The runtime should challenge unpaid requests with a valid{" "}
              <code>WWW-Authenticate</code> header.
            </li>
            <li>
              The agent should stop and ask before registering. Review the
              origin and routes it plans to list, then approve — registering
              publishes a listing agents will call and pay for.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Test your API</h2>
          <p className="text-sm text-muted-foreground">
            Run discovery against your origin to see what x402scan resolves
            before you register.
          </p>
          <TryDiscovery />
        </section>

        <section className="flex items-center gap-2">
          <Button size="sm" render={<Link href="/resources/register" />}>
            + Add your API
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/discovery/spec" />}
          >
            Read the discovery spec →
          </Button>
        </section>
      </Body>
    </div>
  );
}
