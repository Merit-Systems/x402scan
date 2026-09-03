import Link from "next/link";

import { DiscoveryPageHeader } from "@/app/(app)/(home)/discovery/_components/page-header";
import { DocumentationPage } from "@/components/documentation-page";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { Typeset } from "@/components/ui/typeset";
import { env } from "@/env";

const description =
  "Explore x402 payments, transactions, servers, facilitators, and paid APIs across the x402 ecosystem.";

const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

const faqs = [
  {
    question: "What is x402?",
    answer:
      "x402 is an open, neutral, HTTP-native payments standard that lets clients and servers complete payments through the existing 402 Payment Required flow.",
  },
  {
    question: "How does x402 work?",
    answer:
      "A client requests a paid resource, the server responds with 402 Payment Required, the client pays, retries the request, and receives API access.",
  },
  {
    question: "What is x402scan?",
    answer:
      "x402scan is an explorer, marketplace, and analytics dashboard for x402 servers, resources, facilitators, transactions, buyers, and sellers.",
  },
  {
    question: "Do x402 APIs need subscriptions or API keys?",
    answer:
      "x402 APIs can support pay-per-request access without manual account setup, prepaid subscriptions, or long-lived API keys.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "x402 Explorer",
    url: `${appUrl}/x402`,
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
        name: "x402",
        item: `${appUrl}/x402`,
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
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "x402scan",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: appUrl,
    description:
      "Explorer, marketplace, and analytics dashboard for x402 payments and paid APIs.",
  },
];

export function X402Content() {
  return (
    <DocumentationPage>
      <JsonLd data={jsonLd} />
      <DiscoveryPageHeader
        title="x402"
        description="An HTTP-native payment standard for paid APIs and agentic commerce."
      >
        <div data-not-typeset>
          <Button size="sm" render={<Link href="/" />}>
            Discover services
          </Button>
        </div>
      </DiscoveryPageHeader>
      <Typeset>
        <h2>What is x402?</h2>
        <p>
          x402 is an open, neutral standard for internet-native payments between
          clients and servers. Instead of forcing a user or agent through
          account creation, checkout, and prepaid credits, a server can answer a
          paid request with <code>402 Payment Required</code>.
        </p>
        <p>
          The client reads the payment requirements, pays, retries the request,
          and receives access to the API or resource. That flow makes paid APIs
          usable by software, not just by humans filling out web forms.
        </p>

        <h2>How x402 works</h2>
        <ol>
          <li>
            <strong>Request:</strong> a client or AI agent sends a normal HTTP
            request to a paid resource.
          </li>
          <li>
            <strong>Pay:</strong> the server responds with{" "}
            <code>402 Payment Required</code> and the client submits payment.
          </li>
          <li>
            <strong>Retry:</strong> the client retries with payment proof and
            receives the API result.
          </li>
        </ol>

        <h2>Why x402 matters</h2>
        <p>
          Paid APIs usually require accounts, checkout, prepaid credits, and API
          keys before software can do anything useful. x402 lets services price
          individual requests, so agents and developers can pay only when they
          need access.
        </p>

        <h2>Explore x402 on x402scan</h2>
        <p>
          x402scan indexes the services, payments, and infrastructure behind the
          x402 ecosystem.
        </p>
        <ul>
          <li>
            <Link href="/">Discover services</Link>
          </li>
          <li>
            <Link href="/facilitators">Facilitators</Link>
          </li>
          <li>
            <Link href="/networks">Networks</Link>
          </li>
        </ul>

        <h2>Build with x402</h2>
        <p>
          Register an x402-compatible API so agents and developers can discover
          what it does, what it costs, and how to call it.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row" data-not-typeset>
          <Button render={<Link href="/resources/register" />}>
            Add your API
          </Button>
          <Button variant="outline" render={<Link href="/discovery" />}>
            Become discoverable
          </Button>
        </div>
      </Typeset>
    </DocumentationPage>
  );
}
