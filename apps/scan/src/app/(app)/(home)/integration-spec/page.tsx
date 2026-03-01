import Link from 'next/link';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Button } from '@/components/ui/button';
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

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discovery Spec',
  description:
    'x402scan discovery and registration specification for OpenAPI, .well-known, DNS, and endpoint-only compatibility.',
};

const endpointExample = `curl -i -X POST https://yourdomain.com/api/route
curl -i -X GET https://yourdomain.com/api/route`;

const agentChecklist = `Use this checklist to validate discovery for a provider:

1) Progressive audit
npx -y @agentcash/discovery <domain>

2) Full verbose matrix
npx -y @agentcash/discovery <domain> -v

3) JSON output for CI/debug
npx -y @agentcash/discovery <domain> --json

4) Local dev server audit
npx -y @agentcash/discovery http://localhost:3000 -v

Interpretation:
- Prefer OpenAPI integration first.
- Keep /.well-known/x402 and DNS _x402 only for compatibility.
- Runtime 402 challenge is authoritative when static metadata disagrees.`;

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
        <section className="rounded-md bg-primary/5 px-4 py-3 md:px-5 md:py-4">
          <h2 className="text-lg font-semibold md:text-xl">Why This Spec Exists</h2>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
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
                A minimal checklist an agent can run to validate both local and remote integration.
              </p>
            </div>
            <CopyForAgentsButton text={agentChecklist} />
          </div>
          <CodeBlock
            code={`npx -y @agentcash/discovery <domain>
npx -y @agentcash/discovery <domain> -v
npx -y @agentcash/discovery <domain> --json`}
          />
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
          <ol className="space-y-2 text-sm md:text-base">
            <li>
              <span className="font-semibold">1. OpenAPI document:</span> <code>/openapi.json</code>{' '}
              then <code>/.well-known/openapi.json</code>
            </li>
            <li>
              <span className="font-semibold">2. Well-known fan-out:</span>{' '}
              <code>/.well-known/x402</code>
            </li>
            <li>
              <span className="font-semibold">3. DNS pointer:</span> TXT at <code>_x402</code>
            </li>
          </ol>
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
          <div>
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

            <div className="space-y-3 md:hidden">
              <div className="border-l-2 border-border pl-3 space-y-2">
                <p className="font-mono text-xs break-words">Expected 402, got 404/405</p>
                <p className="text-sm text-muted-foreground">Wrong method or wrong path</p>
                <p className="text-sm">Fix: Match method/path to your actual handler</p>
              </div>
              <div className="border-l-2 border-border pl-3 space-y-2">
                <p className="font-mono text-xs break-words">
                  Accepts must contain at least one valid payment requirement
                </p>
                <p className="text-sm text-muted-foreground">
                  Malformed or empty payment requirements
                </p>
                <p className="text-sm">Fix: Return a valid non-empty x402 accepts set</p>
              </div>
              <div className="border-l-2 border-border pl-3 space-y-2">
                <p className="font-mono text-xs break-words">Missing input schema</p>
                <p className="text-sm text-muted-foreground">
                  Strict parser cannot infer invocable contract
                </p>
                <p className="text-sm">Fix: Publish Bazaar/OpenAPI input schema metadata</p>
              </div>
              <div className="border-l-2 border-border pl-3 space-y-2">
                <p className="font-mono text-xs break-words">Expected 402, got 429</p>
                <p className="text-sm text-muted-foreground">Provider-side throttling</p>
                <p className="text-sm">Fix: Retry, reduce probe volume, or register URL-only</p>
              </div>
            </div>
          </div>
        </section>
      </Body>
    </div>
  );
}
