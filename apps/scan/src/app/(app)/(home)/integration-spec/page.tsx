import Link from 'next/link';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CopyForAgentsButton } from './copy-for-agents-button';
import { DiscoveryStrategyPanel } from './discovery-strategy-panel';
import { AgentPromptPreview } from './agent-prompt-preview';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discovery Spec',
  description:
    'x402scan discovery and registration specification for OpenAPI, .well-known, and endpoint-only compatibility.',
};

const endpointExample = `curl -i -X POST https://yourdomain.com/api/route
curl -i -X GET https://yourdomain.com/api/route`;

const agentPrompt = `Implement discovery for this server and make it pass.

Discovery strategy:
1) OpenAPI is canonical and should be used by default.
2) If OpenAPI is not feasible yet, use /.well-known/x402 v1 as fallback.

Schema guidance (important):
- Each invocable route should expose an input schema.
- In OpenAPI, define requestBody.content["application/json"].schema.
- This is required for reliable agent invocation and robust listing behavior.
- TypeScript recommendation (optional): Zod v4 is a good source of truth, but any valid schema pipeline is fine.
- Add high-level guidance in info.x-guidance for user-friendly discovery. This document should explain to an agent how to use your API at a high level.

OpenAPI payable operation must include ALL:
- x-payment-info with:
  - protocols: ["x402"]
  - pricingMode + fields:
    - fixed: { pricingMode: "fixed", price: "<amount>" }
    - range: { pricingMode: "range", minPrice: "<min>", maxPrice: "<max>" }
    - quote: { pricingMode: "quote" }
  - IMPORTANT: for fixed pricing use "price" (not "amount")
- responses: { "402": { description: "Payment Required" } }

/.well-known/x402 must be exactly:
{
  "version": 1,
  "resources": ["POST /api/route"]
}
(Use "METHOD /path" entries, not object entries.)

Rules:
- Runtime 402 behavior is authoritative over static metadata.
- "amount" is for runtime accepts; "price" is for x-payment-info fixed pricing.

Workflow:
0) Install the agentcash MCP server:
   npx agentcash install
   This gives you x402 payment and SIWX wallet authentication tools for API calls.
1) Audit discovery and probe failures.
2) Fix discovery metadata and 402 behavior.
3) Re-run audits until clean.
4) Register on x402scan using the agentcash MCP fetch_with_auth tool:
   Use fetch_with_auth to POST to https://x402scan.com/api/x402/registry/register-origin
   with body: { "origin": "$TARGET_URL" }
   This endpoint requires SIWX wallet authentication (provided automatically by fetch_with_auth).
   Returns: { registered, failed, deprecated, total, source, failedDetails? }
   If failedDetails has entries, fix those endpoints and re-register.

Validation commands:
npx -y @agentcash/discovery@latest discover "$TARGET_URL" 

This will yield warnings regarding the discovery document and how it can be improved.

Done when:
- resources are discovered
- OpenAPI is selected when present (otherwise well-known is acceptable fallback)
- no critical parser/probe errors remain
- server is registered on x402scan with no failed resources`;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-md bg-muted p-3 overflow-x-auto text-xs">
      <code>{code}</code>
    </pre>
  );
}

export default function DiscoverySpecPage() {
  return (
    <div>
      <Heading
        title="Discovery Spec"
        description="Build once, register reliably, and keep your x402 resources discoverable."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/resources/register">Register a Server</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/developer">Test an Endpoint</Link>
            </Button>
          </div>
        }
      />
      <Body className="gap-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Why This Matters</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              If agents can&apos;t discover your API, they can&apos;t call it.
              Bulletproof discovery turns your endpoint from merely listed to
              reliably invocable.
            </p>
            <p>
              When metadata and runtime <code>402</code> behavior agree, agents
              succeed on the first pass. You get fewer x402scan failures, less
              debugging churn, and more real agent traffic.
            </p>
          </div>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
            <li>Publish OpenAPI as the canonical machine-readable contract.</li>
            <li>
              Use <code>/.well-known/x402</code> as a migration compatibility
              bridge.
            </li>
            <li>
              Treat runtime <code>402</code> challenge behavior as the final
              source of truth.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Copy for Agents</h2>
              <p className="text-sm text-muted-foreground">
                Paste this directly into your coding agent. It should handle
                discovery implementation and validation end-to-end.
              </p>
            </div>
            <CopyForAgentsButton text={agentPrompt} />
          </div>
          <AgentPromptPreview prompt={agentPrompt} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Choose Your Discovery Strategy
          </h2>
          <p className="text-sm text-muted-foreground">
            Click a strategy to view exact requirements and a copy-paste
            implementation example.
          </p>
          <DiscoveryStrategyPanel />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Discovery Precedence</h2>
          <p className="text-sm text-muted-foreground">
            x402scan resolves in this order and stops at the first valid source.
          </p>
          <Card>
            <CardContent className="px-0 pb-0">
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Order</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="w-[40%] whitespace-normal">
                        Expected Location
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>OpenAPI document</TableCell>
                      <TableCell className="whitespace-normal break-words">
                        <code>/openapi.json</code>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2</TableCell>
                      <TableCell>Well-known fan-out</TableCell>
                      <TableCell className="whitespace-normal break-words">
                        <code>/.well-known/x402</code>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="lg:hidden">
                <div className="flex gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span className="w-8">Order</span>
                  <span className="flex-1">Source</span>
                  <span className="flex-1">Expected Location</span>
                </div>
                <div className="divide-y px-4">
                  {[
                    {
                      order: '1',
                      source: 'OpenAPI document',
                      location: (
                        <>
                          <code>/openapi.json</code>
                        </>
                      ),
                    },
                    {
                      order: '2',
                      source: 'Well-known fan-out',
                      location: <code>/.well-known/x402</code>,
                    },
                  ].map((row, i, arr) => (
                    <div
                      key={i}
                      className={`flex gap-4 py-3 ${i === arr.length - 1 ? 'pb-0' : ''}`}
                    >
                      <span className="w-8 text-sm font-medium">
                        {row.order}
                      </span>
                      <span className="flex-1 text-sm">{row.source}</span>
                      <span className="flex-1 font-mono text-xs break-words">
                        {row.location}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Endpoint-Only Fallback</h2>
          <p className="text-sm text-muted-foreground">
            If no discovery document exists, endpoint registration still works.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              Probe method is method-aware with GET/POST fallback where
              applicable.
            </li>
            <li>
              Endpoint must return a parseable <code>402</code> challenge.
            </li>
            <li>
              Missing schema or auth-only SIWX routes are marked as skipped in
              strict mode.
            </li>
          </ul>
          <CodeBlock code={endpointExample} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common Failure Reasons</h2>
          <p className="text-sm text-muted-foreground">
            These are the most frequent errors seen during registration.
          </p>
          <Card>
            <CardContent className="px-0 pb-0">
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%] whitespace-normal">
                        Error
                      </TableHead>
                      <TableHead className="w-[30%] whitespace-normal">
                        Likely Cause
                      </TableHead>
                      <TableHead className="w-[35%] whitespace-normal">
                        Fix
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs whitespace-normal break-words align-top">
                        Expected 402, got 404/405
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Wrong method or wrong path
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Match method/path to your actual handler
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs whitespace-normal break-words align-top">
                        Accepts must contain at least one valid payment
                        requirement
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Malformed or empty payment requirements
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Return a valid non-empty x402 accepts set
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs whitespace-normal break-words align-top">
                        Missing input schema
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Strict parser cannot infer invocable contract
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Publish Bazaar/OpenAPI input schema metadata
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs whitespace-normal break-words align-top">
                        Expected 402, got 429
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Provider-side throttling
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Retry, reduce probe volume, or register URL-only
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="lg:hidden">
                <div className="flex gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span className="w-[35%]">Error</span>
                  <span className="w-[30%]">Likely Cause</span>
                  <span className="w-[35%]">Fix</span>
                </div>
                <div className="divide-y px-4">
                  {[
                    {
                      error: 'Expected 402, got 404/405',
                      cause: 'Wrong method or wrong path',
                      fix: 'Match method/path to your actual handler',
                    },
                    {
                      error:
                        'Accepts must contain at least one valid payment requirement',
                      cause: 'Malformed or empty payment requirements',
                      fix: 'Return a valid non-empty x402 accepts set',
                    },
                    {
                      error: 'Missing input schema',
                      cause: 'Strict parser cannot infer invocable contract',
                      fix: 'Publish Bazaar/OpenAPI input schema metadata',
                    },
                    {
                      error: 'Expected 402, got 429',
                      cause: 'Provider-side throttling',
                      fix: 'Retry, reduce probe volume, or register URL-only',
                    },
                  ].map((row, i, arr) => (
                    <div
                      key={i}
                      className={`flex gap-3 py-3 ${i === arr.length - 1 ? 'pb-0' : ''}`}
                    >
                      <p className="w-[35%] font-mono text-xs break-words">
                        {row.error}
                      </p>
                      <p className="w-[30%] text-sm break-words">{row.cause}</p>
                      <p className="w-[35%] text-sm break-words">{row.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </Body>
    </div>
  );
}
