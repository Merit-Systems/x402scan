import Link from 'next/link';

import { Body, Heading, Section } from '@/app/_components/layout/page-utils';
import { JsonLd } from '../../_components/json-ld';
import { Button } from '@/components/ui/button';
import { env } from '@/env';

const description =
  'Learn how AI agents discover, pay for, and use APIs through x402 payments, discovery specs, and x402scan listings.';

const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

const faqs = [
  {
    question: 'What is agentic commerce?',
    answer:
      'Agentic commerce is the market where AI agents discover, pay for, and use digital services directly on behalf of users or businesses.',
  },
  {
    question: 'How do agents pay for APIs?',
    answer:
      'Agents can use open payment standards such as x402 to receive a 402 Payment Required challenge, pay per request, and retry the API call automatically.',
  },
  {
    question: 'What role does x402scan play?',
    answer:
      'x402scan is the marketplace, explorer, and analytics layer where x402 services can be listed, discovered, and measured.',
  },
  {
    question: 'What role does AgentCash play?',
    answer:
      'AgentCash is an MCP that helps agents discover premium APIs, pay with stablecoin micropayments, and execute requests.',
  },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Agentic Commerce',
    url: `${appUrl}/agentic-commerce`,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'x402scan',
      url: appUrl,
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${appUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Agentic Commerce',
        item: `${appUrl}/agentic-commerce`,
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  },
];

export function AgenticCommerceContent() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <Heading
        title="Agentic Commerce"
        description="AI agents discover, pay for, and use digital services directly."
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild size="sm">
              <Link href="/resources/register">Register API</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/resources">Browse services</Link>
            </Button>
          </div>
        }
      />
      <Body className="gap-8">
        <Section title="What is agentic commerce?">
          <div className="max-w-3xl space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Agentic commerce happens when AI agents discover, pay for, and use
              digital services directly. In this model, the commercial unit is
              often an API request rather than a pageview, subscription, or
              human checkout session.
            </p>
            <p>
              This matters because more internet activity is moving through
              agent interfaces. When agents do the work, providers need ways to
              charge directly for data, content, tools, and services that can be
              called programmatically.
            </p>
          </div>
        </Section>

        <Section
          title="How providers sell to agents"
          description="The provider path is simple: make the API payable, make it discoverable, and let agents call it."
        >
          <ol className="max-w-3xl space-y-3 text-sm leading-6 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1. Add pay-per-call:</span>{' '}
              enable per-request pricing so agents can pay without
              subscriptions or invoices.
            </li>
            <li>
              <span className="font-medium text-foreground">2. Publish discovery:</span>{' '}
              describe what the API does, what it costs, and how an agent should
              call it.
            </li>
            <li>
              <span className="font-medium text-foreground">3. Reach agents:</span>{' '}
              let agents inspect schemas and pricing, pay, and execute the
              request.
            </li>
          </ol>
        </Section>

        <Section
          title="The x402scan role"
          description="x402scan is the public marketplace and analytics layer for x402 services."
        >
          <div className="max-w-3xl space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              x402 is the payment standard, AgentCash is the MCP for
              discovering and paying for premium APIs, and x402scan is where
              those services become visible.
            </p>
            <p>
              The goal is not a new checkout page. The goal is a market where
              software can understand the service, pay the listed price, and get
              the result.
            </p>
          </div>
        </Section>

        <Section
          title="Enter the agent market"
          description="Register your API on x402scan and publish discovery metadata so agents can understand and call it."
        >
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link className="font-medium underline-offset-4 hover:underline" href="/discovery">
              Sell to agents
            </Link>
            <Link className="font-medium underline-offset-4 hover:underline" href="/resources/register">
              Register API
            </Link>
            <Link className="font-medium underline-offset-4 hover:underline" href="/x402">
              Explore x402
            </Link>
          </div>
        </Section>
      </Body>
    </>
  );
}
