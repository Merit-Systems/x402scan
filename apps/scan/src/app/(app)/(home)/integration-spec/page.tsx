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
import { AgentPromptPreview } from './agent-prompt-preview';
import { TryDiscovery } from './try-discovery';
import { CopyPageButton } from './_components/copy-page-button';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become Discoverable',
  description:
    'Build once, register reliably, and keep your resources discoverable by agents.',
};

const endpointExample = `curl -i -X POST https://yourdomain.com/api/route
curl -i -X GET https://yourdomain.com/api/route`;

const agentPrompt = `Implement discovery for this server and make it pass.

Discovery strategy:
- OpenAPI is the canonical discovery contract. Publish your spec at /openapi.json.

Schema guidance (important):
- Each invocable route should expose an input schema.
- In OpenAPI, define requestBody.content["application/json"].schema.
- This is required for reliable agent invocation and robust listing behavior.
- TypeScript recommendation (optional): Zod v4 is a good source of truth, but any valid schema pipeline is fine.
- Add high-level guidance in info.x-guidance for user-friendly discovery. This document should explain to an agent how to use your API at a high level.

OpenAPI payable operation must include ALL:
- x-payment-info with:
  - price (structured object):
    - fixed: { mode: "fixed", currency: "USD", amount: "<amount>" }
    - dynamic: { mode: "dynamic", currency: "USD", min: "<min>", max: "<max>" }
  - protocols (array of objects):
    - { "x402": {} }
- responses: { "402": { description: "Payment Required" } }

SIWX (identity-only) routes:
- Declare a security scheme named "siwx" in components.securitySchemes.
- Reference it on each identity-gated operation: security: [{ "siwx": [] }].
- Do NOT add x-payment-info to SIWX-only routes — that classifies them as paid.

Rules:
- Runtime 402 behavior is authoritative over static metadata.
- "amount" is for both runtime accepts and x-payment-info fixed pricing.

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
npx -y @agentcash/discovery@latest check "$ENDPOINT_URL"

These yield warnings regarding the discovery document and how it can be improved.

Done when:
- resources are discovered from OpenAPI
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
        title="Become discoverable"
        description="Build once, register reliably, and keep your resources discoverable by agents."
        actions={
          <div className="flex items-center gap-2">
            <CopyPageButton />
            <Button asChild size="sm">
              <Link href="/resources/register">Add your API</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/developer">Test an Endpoint</Link>
            </Button>
          </div>
        }
      />
      <Body className="gap-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Why This Matters</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              If agents can&apos;t discover your API, they can&apos;t call it.
              Bulletproof discovery turns your endpoint from merely listed to
              reliably invocable.
            </p>
            <p>
              When metadata and runtime <code>402</code> behavior agree, agents
              succeed on the first pass. You get fewer failures, less debugging
              churn, and more real agent traffic.
            </p>
          </div>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
            <li>Publish OpenAPI as the canonical machine-readable contract.</li>
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
          <h2 className="text-xl font-semibold">Test your API</h2>
          <p className="text-sm text-muted-foreground">
            Run discovery against your origin to see what x402scan resolves
            before you register.
          </p>
          <TryDiscovery />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Discovery Strategy</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              OpenAPI is the canonical discovery format. Use it for the cleanest
              machine-readable contract and best agent compatibility.
            </p>
            <p>
              Expected location: <code>GET /openapi.json</code>
            </p>
          </div>
          <Card>
            <CardContent className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold">Requirements</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  Top-level fields: <code>openapi</code>,{' '}
                  <code>info.title</code>, <code>info.x-guidance</code>,{' '}
                  <code>info.version</code>, <code>paths</code>.
                </li>
                <li>
                  For paid operations: <code>responses.402</code> and{' '}
                  <code>x-payment-info</code>.
                </li>
                <li>
                  Set <code>x-payment-info.protocols</code> (array of protocol
                  objects) and one pricing mode (<code>fixed</code> or{' '}
                  <code>dynamic</code>) with <code>currency</code>.
                </li>
                <li>
                  Use OpenAPI <code>security</code> +{' '}
                  <code>components.securitySchemes</code> for auth declaration.
                </li>
                <li>
                  Add high-level guidance in <code>info.x-guidance</code> for
                  agent-friendly discovery.
                </li>
              </ul>
              <h3 className="text-sm font-semibold">
                Pricing modes in <code>x-payment-info</code>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  Fixed:{' '}
                  <code>
                    {'{ price: { mode: "fixed", currency: "USD", amount: "<amount>" } }'}
                  </code>
                </li>
                <li>
                  Dynamic:{' '}
                  <code>
                    {'{ price: { mode: "dynamic", currency: "USD", min: "<min>", max: "<max>" } }'}
                  </code>
                </li>
              </ul>
              <h3 className="text-sm font-semibold">Minimal valid example</h3>
              <CodeBlock
                code={`{
  "openapi": "3.1.0",
  "info": {
    "title": "My API",
    "version": "1.0.0",
    "description": "example demo server",
    "x-guidance": "Use POST /api/search for neural web search. Accepts a JSON body with a 'query' field."
  },
  "paths": {
    "/api/search": {
      "post": {
        "operationId": "search",
        "summary": "Search - Neural search across the web",
        "tags": ["Search"],
        "x-payment-info": {
          "price": { "mode": "fixed", "currency": "USD", "amount": "0.010000" },
          "protocols": [{ "x402": {} }]
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": { "type": "string", "minLength": 1, "description": "The query string for the search" }
                },
                "required": ["query"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "results": { "type": "array", "items": { "type": "object" } }
                  },
                  "required": ["results"]
                }
              }
            }
          },
          "402": { "description": "Payment Required" }
        }
      }
    }
  }
}`}
              />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Discovery Precedence</h2>
          <p className="text-sm text-muted-foreground">
            x402scan uses the OpenAPI document at <code>/openapi.json</code> to
            discover your API. It will also check the runtime <code>402</code>{' '}
            challenge behavior to ensure it is correct.
          </p>
          <Card>
            <CardContent className="px-0 pb-0 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Order</TableHead>
                    <TableHead className="w-[40%]">Source</TableHead>
                    <TableHead className="w-[40%]">Expected Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>OpenAPI document</TableCell>
                    <TableCell>
                      <code>/openapi.json</code>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2</TableCell>
                    <TableCell><code>402</code> API Response</TableCell>
                    <TableCell>Correct <code>402</code> header response</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            SIWX (Sign-In with X) Routes
          </h2>
          <p className="text-sm text-muted-foreground">
            SIWX routes are identity-gated, requiring a wallet proof but no
            payment. Agents with an agentcash wallet can call these for free.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              Declare a security scheme named <code>siwx</code> in{' '}
              <code>components.securitySchemes</code>.
            </li>
            <li>
              Reference it on each identity-gated operation via{' '}
              <code>
                security: [{'{'} &quot;siwx&quot;: [] {'}'}]
              </code>
              .
            </li>
            <li>
              Do <strong>not</strong> add <code>x-payment-info</code> to
              SIWX-only routes, as that classifies them as paid.
            </li>
          </ul>
          <CodeBlock
            code={`{
  "components": {
    "securitySchemes": {
      "siwx": {
        "type": "apiKey",
        "in": "header",
        "name": "SIGN-IN-WITH-X"
      }
    }
  },
  "paths": {
    "/api/me": {
      "get": {
        "summary": "Get current user profile",
        "security": [{ "siwx": [] }],
        "responses": { "200": { "description": "OK" } }
      }
    }
  }
}`}
          />
          <p className="text-sm text-muted-foreground">
            The scheme <strong>must</strong> be named <code>siwx</code>.
            Discovery resolves it by name. Routes with both{' '}
            <code>x-payment-info</code> and <code>siwx</code> security are
            classified as paid, not SIWX.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Endpoint-Only Fallback</h2>
          <p className="text-sm text-muted-foreground">
            If no OpenAPI document exists, a single endpoint URL can still be
            registered. x402scan probes the URL directly via{' '}
            <code>checkEndpointSchema</code> from{' '}
            <code>@agentcash/discovery</code>.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              The probe is method-aware. It tries <code>POST</code> first, then{' '}
              <code>GET</code>, <code>PUT</code>, <code>PATCH</code>,{' '}
              <code>DELETE</code>, and picks the first response with a valid
              x402 payment option.
            </li>
            <li>
              The endpoint must return a parseable <code>402</code> challenge
              with at least one x402 entry in <code>accepts</code>.
            </li>
            <li>
              Endpoints without an input schema are non-invocable and are
              skipped during registration. Publish an OpenAPI schema (or a{' '}
              <code>402</code> body that carries one) to make the endpoint
              registerable.
            </li>
            <li>
              SIWX endpoints are registered as identity-only. No payment is
              required, but agents still need a wallet proof to call them.
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
              {(() => {
                const rows: { error: string; cause: React.ReactNode; fix: React.ReactNode }[] = [
                  {
                    error: 'Not Found',
                    cause: <><span>OpenAPI not found at </span><code>{'{origin}'}/openapi.json</code></>,
                    fix: <><span>Add an OpenAPI document at </span><code>{'{origin}'}/openapi.json</code></>,
                  },
                  {
                    error: 'Input/Output Schema Missing',
                    cause: 'Operation has no input or output schema',
                    fix: 'Add an input and output schema to the operation',
                  },
                  {
                    error: 'No Payment Modes Detected',
                    cause: 'No payment modes detected in the response',
                    fix: 'Add a valid payment mode to the response (x402)',
                  },
                ];
                return (
                  <>
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%] whitespace-normal">
                              Error
                            </TableHead>
                            <TableHead className="w-[35%] whitespace-normal">
                              Likely Cause
                            </TableHead>
                            <TableHead className="w-[35%] whitespace-normal">
                              Fix
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map(row => (
                            <TableRow key={row.error}>
                              <TableCell className="font-mono text-xs whitespace-normal break-words align-top">
                                {row.error}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words align-top">
                                {row.cause}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words align-top">
                                {row.fix}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="lg:hidden">
                      <div className="flex gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                        <span className="w-[30%]">Error</span>
                        <span className="w-[35%]">Likely Cause</span>
                        <span className="w-[35%]">Fix</span>
                      </div>
                      <div className="divide-y px-4">
                        {rows.map((row, i, arr) => (
                          <div
                            key={row.error}
                            className={`flex gap-3 py-3 ${i === arr.length - 1 ? 'pb-0' : ''}`}
                          >
                            <p className="w-[30%] font-mono text-xs break-words">
                              {row.error}
                            </p>
                            <p className="w-[35%] text-sm break-words">
                              {row.cause}
                            </p>
                            <p className="w-[35%] text-sm break-words">
                              {row.fix}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </section>
      </Body>
    </div>
  );
}
