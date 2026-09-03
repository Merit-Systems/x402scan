import Link from "next/link";

import { DiscoveryPageHeader } from "@/app/(app)/(home)/discovery/_components/page-header";
import { DocumentationPage } from "@/components/documentation-page";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { Typeset } from "@/components/ui/typeset";
import { env } from "@/env";

const description =
  "Learn how AI agents discover, pay for, and use APIs through x402 payments, discovery specs, and x402scan listings.";

const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

const faqs = [
  {
    question: "What is agentic commerce?",
    answer:
      "Agentic commerce is the market where AI agents discover, pay for, and use digital services directly on behalf of users or businesses.",
  },
  {
    question: "How do agents pay for APIs?",
    answer:
      "Agents can use open payment standards such as x402 to receive a 402 Payment Required challenge, pay per request, and retry the API call automatically.",
  },
  {
    question: "What role does x402scan play?",
    answer:
      "x402scan is the marketplace, explorer, and analytics layer where x402 services can be listed, discovered, and measured.",
  },
  {
    question: "What role does AgentCash play?",
    answer:
      "AgentCash is an MCP that helps agents discover premium APIs, pay with stablecoin micropayments, and execute requests.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Agentic Commerce",
    url: `${appUrl}/agentic-commerce`,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "x402scan",
      url: appUrl,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${appUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Agentic Commerce",
        item: `${appUrl}/agentic-commerce`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
];

export function AgenticCommerceContent() {
  return (
    <DocumentationPage>
      <JsonLd data={jsonLd} />
      <DiscoveryPageHeader
        title="Agentic Commerce"
        description="AI agents discover, pay for, and use digital services directly."
      >
        <div className="flex flex-col gap-2 sm:flex-row" data-not-typeset>
          <Button size="sm" render={<Link href="/resources/register" />}>
            Register API
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/" />}>
            Browse services
          </Button>
        </div>
      </DiscoveryPageHeader>
      <Typeset>
        <h2>What is agentic commerce?</h2>
        <p>
          Agentic commerce happens when AI agents discover, pay for, and use
          digital services directly. In this model, the commercial unit is often
          an API request rather than a pageview, subscription, or human checkout
          session.
        </p>
        <p>
          This matters because more internet activity is moving through agent
          interfaces. When agents do the work, providers need ways to charge
          directly for data, content, tools, and services that can be called
          programmatically.
        </p>

        <h2>How providers sell to agents</h2>
        <p>
          The provider path is simple: make the API payable, make it
          discoverable, and let agents call it.
        </p>
        <ol>
          <li>
            <strong>Add pay-per-call:</strong> enable per-request pricing so
            agents can pay without subscriptions or invoices.
          </li>
          <li>
            <strong>Publish discovery:</strong> describe what the API does, what
            it costs, and how an agent should call it.
          </li>
          <li>
            <strong>Reach agents:</strong> let agents inspect schemas and
            pricing, pay, and execute the request.
          </li>
        </ol>

        <h2>The x402scan role</h2>
        <p>
          x402 is the payment standard, AgentCash is the MCP for discovering and
          paying for premium APIs, and x402scan is where those services become
          visible.
        </p>
        <p>
          The goal is not a new checkout page. The goal is a market where
          software can understand the service, pay the listed price, and get the
          result.
        </p>

        <h2>Enter the agent market</h2>
        <p>
          Register your API on x402scan and publish discovery metadata so agents
          can understand and call it.
        </p>
        <ul>
          <li>
            <Link href="/discovery">Sell to agents</Link>
          </li>
          <li>
            <Link href="/resources/register">Register API</Link>
          </li>
          <li>
            <Link href="/x402">Explore x402</Link>
          </li>
        </ul>
      </Typeset>
    </DocumentationPage>
  );
}
