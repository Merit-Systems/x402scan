import Link from 'next/link';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen, Terminal, Layers } from 'lucide-react';
import { DiscoveryHubActions } from './_components/hub-actions';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell to Agents',
  description:
    'Start onboarding agents as customers with x402 payments.',
};

export default function DiscoveryPage() {
  return (
    <div>
      <Heading
        title="Sell to agents"
        description="Start onboarding agents as customers."
        actions={<DiscoveryHubActions />}
      />
      <Body className="gap-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Why</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              AI agents are becoming the primary way people interact with the
              internet. As more activity flows through agent interfaces instead
              of browsers, ad-based business models break since there are no
              human eyeballs to monetize. The businesses that thrive will be the
              ones that charge for their content and services directly.
            </p>
            <p>
              Most agent users have never called an API before. Pay-per-request
              pricing at fractions of a cent opens your service to a massive new
              audience that your existing subscription tiers never reach.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">How</h2>
            <p className="text-sm text-muted-foreground">
              Add a few lines of code to enable pay-per-call, publish a
              discovery specification, and AI agents can start calling your API
              with{' '}
              <a
                href="https://www.x402.org"
                className="underline hover:no-underline font-medium text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                x402
              </a>{' '}
              payments.
            </p>
          </div>

          <div className="space-y-4">
            <Step
              number={1}
              title="Add pay-per-call to your API"
              description="A few lines of code enable per-request pricing. AI agents pay automatically. No subscriptions, no invoices."
            />
            <Step
              number={2}
              title="Publish a discovery specification"
              description="Add a simple file that tells AI agents what your API does, what it costs, and how to call it."
            />
            <Step
              number={3}
              title="Reach agents everywhere"
              description="AI agents discover your API and start calling it. You get immediate distribution to Claude, Cursor, Codex, and every agent on x402."
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Get started</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <NavCard
              href="/discovery/quickstart"
              icon={<Terminal className="size-5" />}
              title="Quickstart with your agent"
              description="Copy a prompt into your coding agent and it handles the rest. The fastest path for most providers."
            />
            <NavCard
              href="/discovery/spec"
              icon={<BookOpen className="size-5" />}
              title="Discovery spec reference"
              description="OpenAPI requirements, SIWX routes, endpoint fallback, and common failure reasons."
            />
            <NavCard
              href="/discovery/architecture"
              icon={<Layers className="size-5" />}
              title="Architecture patterns"
              description="Proxy architecture for wrapping existing APIs without touching your production backend."
            />
          </div>
        </section>
      </Body>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0 mt-0.5">
        {number}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardContent className="flex flex-col gap-3 pt-5">
          <div className="text-primary">{icon}</div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              {title}
              <ArrowRight className="size-3.5" />
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
