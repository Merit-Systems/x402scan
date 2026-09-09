import { JsonLd } from "@/components/json-ld";
import { env } from "@/env";

export const agenticCommerceDescription =
  "Learn how AI agents discover, pay for, and use APIs through x402 payments, discovery specs, and x402scan listings.";

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

export function AgenticCommerceStructuredData() {
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Agentic Commerce",
      url: `${appUrl}/agentic-commerce`,
      description: agenticCommerceDescription,
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

  return <JsonLd data={data} />;
}
