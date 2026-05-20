import Link from 'next/link';

import { Body, Heading, Section } from '@/app/_components/layout/page-utils';
import { JsonLd } from '../../_components/json-ld';
import { Button } from '@/components/ui/button';
import { env } from '@/env';

const description =
  'Explore x402 payments, transactions, servers, facilitators, and paid APIs across the x402 ecosystem.';

const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

const faqs = [
  {
    question: 'What is x402?',
    answer:
      'x402 is an open, neutral, HTTP-native payments standard that lets clients and servers complete payments through the existing 402 Payment Required flow.',
  },
  {
    question: 'How does x402 work?',
    answer:
      'A client requests a paid resource, the server responds with 402 Payment Required, the client pays, retries the request, and receives API access.',
  },
  {
    question: 'What is x402scan?',
    answer:
      'x402scan is an explorer, marketplace, and analytics dashboard for x402 servers, resources, facilitators, transactions, buyers, and sellers.',
  },
  {
    question: 'Do x402 APIs need subscriptions or API keys?',
    answer:
      'x402 APIs can support pay-per-request access without manual account setup, prepaid subscriptions, or long-lived API keys.',
  },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'x402 Explorer',
    url: `${appUrl}/x402`,
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
        name: 'x402',
        item: `${appUrl}/x402`,
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
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'x402scan',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: appUrl,
    description:
      'Explorer, marketplace, and analytics dashboard for x402 payments and paid APIs.',
  },
];

export function X402Content() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <Heading
        title="x402"
        description="An HTTP-native payment standard for paid APIs and agentic commerce."
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild size="sm">
              <Link href="/resources">Explore marketplace</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/transactions">View transactions</Link>
            </Button>
          </div>
        }
      />
      <Body className="gap-8">
        <Section title="What is x402?">
          <div className="max-w-3xl space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              x402 is an open, neutral standard for internet-native payments
              between clients and servers. Instead of forcing a user or agent
              through account creation, checkout, and prepaid credits, a server
              can answer a paid request with <code>402 Payment Required</code>.
            </p>
            <p>
              The client reads the payment requirements, pays, retries the
              request, and receives access to the API or resource. That flow
              makes paid APIs usable by software, not just by humans filling out
              web forms.
            </p>
          </div>
        </Section>

        <Section title="How x402 works">
          <ol className="max-w-3xl space-y-3 text-sm leading-6 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1. Request:</span> a
              client or AI agent sends a normal HTTP request to a paid resource.
            </li>
            <li>
              <span className="font-medium text-foreground">2. Pay:</span> the
              server responds with <code>402 Payment Required</code> and the
              client submits payment.
            </li>
            <li>
              <span className="font-medium text-foreground">3. Retry:</span> the
              client retries with payment proof and receives the API result.
            </li>
          </ol>
        </Section>

        <Section
          title="Why x402 matters"
          description="x402 replaces manual API onboarding with request-time access."
        >
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Paid APIs usually require accounts, checkout, prepaid credits, and
            API keys before software can do anything useful. x402 lets services
            price individual requests, so agents and developers can pay only
            when they need access.
          </p>
        </Section>

        <Section
          title="Explore x402 on x402scan"
          description="x402scan indexes the services, payments, and infrastructure behind the x402 ecosystem."
        >
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              className="font-medium underline-offset-4 hover:underline"
              href="/resources"
            >
              Marketplace
            </Link>
            <Link
              className="font-medium underline-offset-4 hover:underline"
              href="/transactions"
            >
              Transactions
            </Link>
            <Link
              className="font-medium underline-offset-4 hover:underline"
              href="/facilitators"
            >
              Facilitators
            </Link>
            <Link
              className="font-medium underline-offset-4 hover:underline"
              href="/networks"
            >
              Networks
            </Link>
          </div>
        </Section>

        <Section
          title="Build with x402"
          description="Register an x402-compatible API so agents and developers can discover what it does, what it costs, and how to call it."
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild>
              <Link href="/resources/register">Add your API</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/discovery">Become discoverable</Link>
            </Button>
          </div>
        </Section>
      </Body>
    </>
  );
}
