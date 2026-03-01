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
    'x402scan discovery and registration specification for OpenAPI, .well-known, DNS, and endpoint-only compatibility.',
};

const endpointExample = `curl -i -X POST https://yourdomain.com/api/route
curl -i -X GET https://yourdomain.com/api/route`;

const agentPrompt = `Implement discovery for this server and make it pass.

Principles:
- OpenAPI is canonical.
- /.well-known/x402 and DNS _x402 are compatibility layers.
- Runtime 402 behavior is authoritative over static metadata.

Workflow:
1) Audit discovery and probe failures.
2) Fix discovery metadata and 402 behavior.
3) Re-run audits until clean.

Validation commands:
npx -y @agentcash/discovery "$TARGET_URL" --json
npx -y @agentcash/discovery "$TARGET_URL" -v

Done when:
- resources are discovered
- OpenAPI is selected when present
- no critical parser/probe errors remain`;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-md bg-muted p-3 overflow-x-auto text-xs md:text-sm">
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
          <h2 className="text-lg font-semibold md:text-xl">Why This Spec Exists</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Most registration failures come from ambiguous discovery and incomplete 402 metadata.
            This page defines one deterministic path so providers and x402scan stay in sync.
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm md:text-base">
            <li>OpenAPI is the canonical machine-readable contract.</li>
            <li>
              <code>/.well-known/x402</code> and DNS are migration compatibility layers.
            </li>
            <li>
              Runtime <code>402</code> challenge behavior is the final source of truth.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Copy for Agents</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Paste this directly into your coding agent. It should handle discovery implementation
                and validation end-to-end.
              </p>
            </div>
            <CopyForAgentsButton text={agentPrompt} />
          </div>
          <AgentPromptPreview prompt={agentPrompt} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Choose Your Discovery Strategy</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Click a strategy to view exact requirements and a copy-paste implementation example.
          </p>
          <DiscoveryStrategyPanel />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Discovery Precedence</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            x402scan resolves in this order and stops at the first valid source.
          </p>
          <Card>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-[40%] whitespace-normal">Expected Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>OpenAPI document</TableCell>
                    <TableCell className="whitespace-normal break-words">
                      <code>/openapi.json</code> then <code>/.well-known/openapi.json</code>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2</TableCell>
                    <TableCell>Well-known fan-out</TableCell>
                    <TableCell className="whitespace-normal break-words">
                      <code>/.well-known/x402</code>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>3</TableCell>
                    <TableCell>DNS pointer</TableCell>
                    <TableCell className="whitespace-normal break-words">
                      TXT at <code>_x402</code>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Endpoint-Only Fallback</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            If no discovery document exists, endpoint registration still works.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
            <li>Probe method is method-aware with GET/POST fallback where applicable.</li>
            <li>
              Endpoint must return a parseable <code>402</code> challenge.
            </li>
            <li>
              Missing schema or auth-only SIWX routes are marked as skipped in strict mode.
            </li>
          </ul>
          <CodeBlock code={endpointExample} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common Failure Reasons</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            These are the most frequent errors seen during registration.
          </p>
          <Card>
            <CardContent className="px-0 pb-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%] whitespace-normal">Error</TableHead>
                      <TableHead className="w-[30%] whitespace-normal">Likely Cause</TableHead>
                      <TableHead className="w-[35%] whitespace-normal">Fix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs md:text-sm whitespace-normal break-words align-top">
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
                      <TableCell className="font-mono text-xs md:text-sm whitespace-normal break-words align-top">
                        Accepts must contain at least one valid payment requirement
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Malformed or empty payment requirements
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        Return a valid non-empty x402 accepts set
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs md:text-sm whitespace-normal break-words align-top">
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
                      <TableCell className="font-mono text-xs md:text-sm whitespace-normal break-words align-top">
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
                  <p className="font-mono text-xs break-words">Expected 402, got 404/405</p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Wrong method or wrong path
                  </p>
                  <p className="text-sm">Fix: Match method/path to your actual handler</p>
                </div>
                <div className="space-y-2 py-3">
                  <p className="font-mono text-xs break-words">
                    Accepts must contain at least one valid payment requirement
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Malformed or empty payment requirements
                  </p>
                  <p className="text-sm">Fix: Return a valid non-empty x402 accepts set</p>
                </div>
                <div className="space-y-2 py-3">
                  <p className="font-mono text-xs break-words">Missing input schema</p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Strict parser cannot infer invocable contract
                  </p>
                  <p className="text-sm">Fix: Publish Bazaar/OpenAPI input schema metadata</p>
                </div>
                <div className="space-y-2 py-3 last:pb-0">
                  <p className="font-mono text-xs break-words">Expected 402, got 429</p>
                  <p className="text-sm text-muted-foreground">
                    Cause: Provider-side throttling
                  </p>
                  <p className="text-sm">Fix: Retry, reduce probe volume, or register URL-only</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </Body>
    </div>
  );
}
