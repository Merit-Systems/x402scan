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

OpenAPI payable operation must include ALL:
- x-agentcash-auth: { mode: "paid" }
- x-payment-info with:
  - protocols: ["x402"]
  - pricingMode + fields:
    - fixed: { pricingMode: "fixed", price: "<amount>" }
    - range: { pricingMode: "range", minPrice: "<min>", maxPrice: "<max>" }
    - quote: { pricingMode: "quote" }
  - IMPORTANT: for fixed pricing use "price" (not "amount")
- responses: { "402": { description: "Payment Required" } }

Auth mode rules (x-agentcash-auth.mode):
- allowed: "paid" | "siwx" | "apiKey"
- payable route => mode must be "paid"
- non-payable auth-only route can use "siwx" or "apiKey"
- if a route is payable and also supports SIWX, keep mode as "paid"

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
1) Audit discovery and probe failures.
2) Fix discovery metadata and 402 behavior.
3) Re-run audits until clean.

Validation commands:
npx -y @agentcash/discovery "$TARGET_URL" --json
npx -y @agentcash/discovery "$TARGET_URL" -v

Done when:
- resources are discovered
- OpenAPI is selected when present (otherwise well-known is acceptable fallback)
- no critical parser/probe errors remain`;

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
                      <code>/openapi.json</code> then{' '}
                      <code>/.well-known/openapi.json</code>
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
              <div className="hidden md:block">
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

              <div className="divide-y md:hidden">
                <div className="space-y-2 py-3 first:pt-0">
                  <p className="font-mono text-xs break-words">
                    Expected 402, got 404/405
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Wrong method or wrong path
                  </p>
                  <p className="text-sm">
                    Fix: Match method/path to your actual handler
                  </p>
                </div>
                <div className="space-y-2 py-3">
                  <p className="font-mono text-xs break-words">
                    Accepts must contain at least one valid payment requirement
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Malformed or empty payment requirements
                  </p>
                  <p className="text-sm">
                    Fix: Return a valid non-empty x402 accepts set
                  </p>
                </div>
                <div className="space-y-2 py-3">
                  <p className="font-mono text-xs break-words">
                    Missing input schema
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Strict parser cannot infer invocable contract
                  </p>
                  <p className="text-sm">
                    Fix: Publish Bazaar/OpenAPI input schema metadata
                  </p>
                </div>
                <div className="space-y-2 py-3 last:pb-0">
                  <p className="font-mono text-xs break-words">
                    Expected 402, got 429
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Provider-side throttling
                  </p>
                  <p className="text-sm">
                    Fix: Retry, reduce probe volume, or register URL-only
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </Body>
    </div>
  );
}
