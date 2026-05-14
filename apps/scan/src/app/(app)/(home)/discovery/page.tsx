import Link from 'next/link';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Button } from '@/components/ui/button';

import type { Metadata } from 'next';
import type { Route } from 'next';

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
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/resources/register">Register your API</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/discovery/spec">Read the spec</Link>
            </Button>
          </div>
        }
      />
      <Body className="gap-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Why sell to agents?</h2>
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
            <h2 className="text-xl font-semibold">Start selling to agents</h2>
            <p className="text-sm text-muted-foreground">
              Add a few lines of code to enable pay-per-call, publish a
              discovery specification, and AI agents can start calling your API.
              We support the open{' '}
              <a
                href="https://www.x402.org"
                className="underline hover:no-underline font-medium text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                x402
              </a>{' '}
              payment standard.
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
              href="/discovery/spec"
              linkText="See how"
            />
            <Step
              number={3}
              title="Reach agents everywhere"
              description="AI agents discover your API and start calling it. You get immediate distribution to Claude, Cursor, Codex, and every agent on x402."
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
  href,
  linkText,
}: {
  number: number;
  title: string;
  description: string;
  href?: Route;
  linkText?: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0 mt-0.5">
        {number}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {description}
          {href && linkText && (
            <>
              {' '}
              <Link
                href={href}
                className="underline hover:no-underline font-medium text-foreground"
              >
                {linkText} →
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
