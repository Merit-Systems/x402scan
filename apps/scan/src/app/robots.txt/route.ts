import { env } from "@/env";

const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

/**
 * robots.txt with Content Signals.
 *
 * `Content-Signal` declares how x402scan's content may be used by automated
 * systems (contentsignals.org / draft-romm-aipref-contentsignals):
 *   search   = yes  → search engines may index the site
 *   ai-input = yes  → AI systems may use pages as input at query time (e.g. RAG
 *                     / grounding) — x402scan is an agent-facing explorer, so
 *                     this is intentionally allowed
 *   ai-train = no   → do not use this content to train AI models
 *
 * Served as a route handler (rather than the `robots.ts` metadata convention)
 * because that convention can't emit the `Content-Signal` directive.
 */
const body = `# Content-Signal declares content-usage preferences for automated agents.
# https://contentsignals.org/
User-agent: *
Content-Signal: search=yes, ai-train=no, ai-input=yes
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
