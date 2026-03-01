import Link from 'next/link';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CopyForAgentsButton } from './copy-for-agents-button';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discovery Spec',
  description:
    'x402scan discovery and registration specification for OpenAPI, .well-known, DNS, and endpoint-only compatibility.',
};

const openApiExample = `{
  "openapi": "3.1.0",
  "info": { "title": "My API", "version": "1.0.0" },
  "paths": {
    "/api/quote": {
      "post": {
        "security": [{ "siwx": [] }],
        "responses": { "402": { "description": "Payment Required" } },
        "x-payment-info": {
          "protocols": ["x402"],
          "pricingMode": "fixed",
          "price": "0.05"
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "siwx": { "type": "http", "scheme": "bearer" }
    }
  },
  "x-discovery": {
    "ownershipProofs": ["0x..."],
    "llmsTxtUrl": "https://yourdomain.com/llms.txt"
  }
}`;

const wellKnownExample = `{
  "version": 1,
  "resources": [
    "https://yourdomain.com/api/route-1",
    "https://yourdomain.com/api/route-2"
  ],
  "ownershipProofs": ["0x..."]
}`;

const dnsExample =
  '_x402.yourdomain.com TXT "v=x4021;url=https://yourdomain.com/.well-known/x402"';

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
    <pre className="rounded-md border bg-muted p-3 overflow-x-auto text-xs md:text-sm">
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
      <Body className="gap-6">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Why This Spec Exists
              <Badge variant="primary">Important</Badge>
            </CardTitle>
            <CardDescription>
              Most registration failures come from ambiguous discovery and incomplete 402 metadata.
              This page defines one deterministic path so providers and x402scan stay in sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm md:text-base">
            <ul className="list-disc pl-5 space-y-1">
              <li>OpenAPI is the canonical machine-readable contract.</li>
              <li>
                <code>/.well-known/x402</code> and DNS are migration compatibility layers.
              </li>
              <li>
                Runtime <code>402</code> challenge behavior is the final source of truth.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Copy for Agents
                <Badge variant="primary">CLI First</Badge>
              </CardTitle>
              <CardDescription>
                A minimal checklist an agent can run to validate both local and remote integration.
              </CardDescription>
            </div>
            <CopyForAgentsButton text={agentChecklist} />
          </CardHeader>
          <CardContent>
            <CodeBlock
              code={`npx -y @agentcash/discovery <domain>
npx -y @agentcash/discovery <domain> -v
npx -y @agentcash/discovery <domain> --json`}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                OpenAPI
                <Badge variant="success">Recommended</Badge>
              </CardTitle>
              <CardDescription>
                Best signal quality, best compatibility, easiest to reason about.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use <code>/openapi.json</code> or <code>/.well-known/openapi.json</code>.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Well-Known
                <Badge variant="secondary">Compat</Badge>
              </CardTitle>
              <CardDescription>
                Good for fan-out when OpenAPI is not available yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Serve <code>GET /.well-known/x402</code> with a v1 resource list.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                DNS Pointer
                <Badge variant="outline">Legacy</Badge>
              </CardTitle>
              <CardDescription>
                Supported for older integrations. Prefer moving off this over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              TXT record <code>_x402</code> should point to your well-known document.
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Discovery Precedence</CardTitle>
            <CardDescription>
              x402scan resolves in this order and stops at the first valid source.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Expected Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>OpenAPI document</TableCell>
                  <TableCell>
                    <code>/openapi.json</code> then <code>/.well-known/openapi.json</code>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2</TableCell>
                  <TableCell>Well-known fan-out</TableCell>
                  <TableCell>
                    <code>/.well-known/x402</code>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3</TableCell>
                  <TableCell>DNS pointer</TableCell>
                  <TableCell>
                    TXT at <code>_x402</code>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OpenAPI Contract (Canonical)</CardTitle>
            <CardDescription>
              For paid operations, include both static metadata and runtime 402 behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm md:text-base">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Required top-level fields: <code>openapi</code>, <code>info.title</code>,{' '}
                <code>info.version</code>, <code>paths</code>.
              </li>
              <li>
                Per paid operation: <code>x-payment-info</code>, <code>responses.402</code>, and
                <code> x-payment-info.protocols</code>.
              </li>
              <li>
                Supported pricing modes: <code>fixed</code>, <code>range</code>, <code>quote</code>.
              </li>
              <li>
                Auth should be declared with OpenAPI <code>security</code> and
                <code> components.securitySchemes</code>.
              </li>
            </ul>
            <CodeBlock code={openApiExample} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Well-Known Compatibility</CardTitle>
              <CardDescription>
                Use for fan-out if you are not ready to publish OpenAPI yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Endpoint: <code>GET /.well-known/x402</code>
              </p>
              <CodeBlock code={wellKnownExample} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>DNS Compatibility</CardTitle>
              <CardDescription>
                Keep only while you still support older x402scan discovery paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">TXT record example</p>
              <CodeBlock code={dnsExample} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint-Only Fallback</CardTitle>
            <CardDescription>
              If no discovery document exists, endpoint registration still works.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base">
            <ul className="list-disc pl-5 space-y-1">
              <li>Probe method is method-aware with GET/POST fallback where applicable.</li>
              <li>
                Endpoint must return a parseable <code>402</code> challenge.
              </li>
              <li>
                Missing schema or auth-only SIWX routes are marked as skipped in strict mode.
              </li>
            </ul>
            <CodeBlock code={endpointExample} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Failure Reasons</CardTitle>
            <CardDescription>
              These are the most frequent errors seen during registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Error</TableHead>
                  <TableHead>Likely Cause</TableHead>
                  <TableHead>Fix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs md:text-sm">Expected 402, got 404/405</TableCell>
                  <TableCell>Wrong method or wrong path</TableCell>
                  <TableCell>Match method/path to your actual handler</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs md:text-sm">Accepts must contain at least one valid payment requirement</TableCell>
                  <TableCell>Malformed or empty payment requirements</TableCell>
                  <TableCell>Return a valid non-empty x402 accepts set</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs md:text-sm">Missing input schema</TableCell>
                  <TableCell>Strict parser cannot infer invocable contract</TableCell>
                  <TableCell>Publish Bazaar/OpenAPI input schema metadata</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs md:text-sm">Expected 402, got 429</TableCell>
                  <TableCell>Provider-side throttling</TableCell>
                  <TableCell>Retry, reduce probe volume, or register URL-only</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Body>
    </div>
  );
}
