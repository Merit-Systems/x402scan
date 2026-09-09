import { env } from "@/env";

const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

const REPO_URL = "https://github.com/Merit-Systems/x402scan";

/**
 * RFC 9727 API Catalog, served as an RFC 9264 link set
 * (`application/linkset+json`).
 *
 * Advertises the x402scan public API (`/api/x402`) so agents can discover the
 * machine-readable OpenAPI spec, human documentation, and health endpoint
 * without any prior knowledge of the site.
 *
 * Docs: https://www.rfc-editor.org/rfc/rfc9727, https://www.rfc-editor.org/rfc/rfc9264
 */

// Relation-type members keyed as in RFC 9264 §4.2 (each value is an array of
// link target objects). This is the canonical, spec-compliant representation.
const relations = {
  "service-desc": [
    {
      href: `${baseUrl}/openapi.json`,
      type: "application/vnd.oai.openapi+json",
      title: "x402scan OpenAPI specification",
    },
  ],
  "service-doc": [
    {
      href: REPO_URL,
      type: "text/html",
      title: "x402scan documentation",
    },
  ],
  status: [
    {
      href: `${baseUrl}/api/health`,
      type: "application/json",
      title: "x402scan API health",
    },
  ],
} as const;

const linkset = {
  linkset: [
    {
      anchor: `${baseUrl}/api/x402`,
      ...relations,
      // Convenience mirror of the relation members as a flat `links` array
      // (the shape emitted by some agent-readiness scanners). RFC 9264 parsers
      // ignore this unknown member and read the relation-type members above.
      links: Object.entries(relations).flatMap(([rel, targets]) =>
        targets.map((target) => ({ rel, ...target }))
      ),
    },
  ],
};

export function GET() {
  return new Response(JSON.stringify(linkset, null, 2), {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
