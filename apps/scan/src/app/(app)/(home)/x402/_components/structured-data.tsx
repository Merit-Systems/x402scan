import { JsonLd } from "@/components/json-ld";
import { env } from "@/env";

export const x402Description =
  "Explore x402 payments, transactions, servers, facilitators, and paid APIs across the x402 ecosystem.";

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

export function X402StructuredData() {
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "x402 Explorer",
      url: `${appUrl}/x402`,
      description: x402Description,
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

  return <JsonLd data={data} />;
}
