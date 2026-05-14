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

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Architecture Patterns',
  description:
    'High-level architectures for building agent-payable services with x402.',
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-md bg-muted p-3 overflow-x-auto text-xs">
      <code>{code}</code>
    </pre>
  );
}

export default function ArchitecturePage() {
  return (
    <div>
      <Heading
        title="Architecture patterns"
        description="High-level architectures for building agent-payable services."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/resources/register">Add your API</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/discovery/spec">Read the spec</Link>
            </Button>
          </div>
        }
      />
      <Body className="gap-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Proxy architecture</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Restructuring your backend and database to support agentic
              payments can be a daunting, time-consuming task, and in most cases
              it isn&apos;t strictly necessary to bring your service online. The
              pattern below lets you add agentic commerce support with minimal
              changes to your production architecture.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Stand up a thin proxy in front of your existing backend. The proxy
            handles everything x402-specific — payment verification, wallet
            identity, per-wallet authorization, rate limiting, and discovery —
            while your production API stays untouched.
          </p>
          <CodeBlock
            code={`Agent  ──(x402)──▶  Proxy  ──(API key)──▶  Production API
                      │
                      ├─ Payment verify
                      ├─ Wallet identity
                      ├─ Per-wallet authz
                      ├─ Rate limiting
                      ├─ Discovery doc
                      │
                      └─ Wallet mapping DB`}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How it works</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Stand up a separate server (Next.js route handlers are a common
              choice, but any HTTP framework works). Provision a single API key
              from your production backend with broad permissions. The proxy
              acts as a pure consumer of your production API, wrapping each
              endpoint you want to expose over x402 with a corresponding
              payable endpoint on the proxy.
            </p>
            <p>
              All agentic traffic to your production backend appears under a
              single API key. The complexity of per-wallet accounting stays
              isolated in the proxy, so your original backend&apos;s data model
              is unchanged.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Responsibility split</h2>
          <Card>
            <CardContent className="px-0 pb-0 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Concern</TableHead>
                    <TableHead className="w-[30%]">Proxy server</TableHead>
                    <TableHead className="w-[30%]">Production API</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['Payment verification (x402)', '✅', '—'],
                    ['Wallet identity', '✅', '—'],
                    ['Per-wallet authorization', '✅', '—'],
                    ['Per-wallet rate limiting', '✅', '—'],
                    ['Discovery document (/openapi.json)', '✅', '—'],
                    ['Business logic', '—', '✅'],
                    ['User records, billing, quotas', '—', '✅'],
                    ['Long-term data storage', '—', '✅'],
                  ].map(([concern, proxy, prod]) => (
                    <TableRow key={concern}>
                      <TableCell className="text-sm">{concern}</TableCell>
                      <TableCell>{proxy}</TableCell>
                      <TableCell>{prod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">
            The proxy owns everything agent-specific. The production API owns
            everything you already had.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Wallet identity</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Each x402 request carries a signed payment proof. The proxy
              verifies the signature and treats the signing wallet address as
              the caller&apos;s identity. That wallet address becomes the
              primary key for owned resources, rate limits, session state, or
              anything else you track per-caller.
            </p>
            <p>
              If you also need free endpoints gated by wallet identity without
              payment, use SIWX (Sign-In with X). The signature flow is the
              same, but no funds move.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Wallet-aware authorization</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Because every agent call reaches your production API under a
              single god-key, the proxy must enforce per-wallet authorization
              itself. The production API will happily return every row the key
              can see — it&apos;s the proxy&apos;s job to filter.
            </p>
            <p>
              Any endpoint that takes a resource ID must verify that the calling
              wallet owns that resource before proxying through.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Rate limiting</h2>
          <p className="text-sm text-muted-foreground">
            The god-key is intentionally provisioned with loose or absent rate
            limits so that legitimate agent traffic isn&apos;t throttled. The
            tradeoff is that the proxy is now the only thing standing between
            an abusive wallet and your production backend. Apply per-wallet
            rate limits at the proxy by request count, by spend, or both.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Failure semantics</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              x402 settles payment as part of the request. If the downstream
              call to your production API fails after settlement, you have two
              options:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <strong>Don&apos;t settle on failure.</strong> Validate upstream
                health and cheap preconditions before accepting payment, and
                return <code>402</code> on predictable failures.
              </li>
              <li>
                <strong>Refund on failure.</strong> Catch downstream errors and
                issue a refund through the settlement network before returning{' '}
                <code>5xx</code> to the caller.
              </li>
            </ol>
            <p>
              Pick one policy per endpoint and document it. The worst outcome is
              silently charging a wallet for a failed request.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Wallet mapping database</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              If you need to track which wallets own which resources, a
              lightweight database alongside the proxy is usually enough.
              Common tables:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>wallet_address → owned_resource_ids</code> for ownership
                lookups.
              </li>
              <li>
                <code>wallet_address → usage_counters</code> for rate limiting
                and spend caps.
              </li>
              <li>
                <code>wallet_address → session_state</code> for stateful
                workflows.
              </li>
            </ul>
            <p>
              All of this sits outside your production database. From the
              production API&apos;s perspective, nothing changed — it still sees
              a single API key making calls.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">When this pattern fits</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>
              You want to expose existing endpoints over x402 with minimal risk
              to production.
            </li>
            <li>
              Your business logic is already accessible via a clean internal
              API.
            </li>
            <li>
              Per-wallet state is shallow enough to live in a sidecar database.
            </li>
          </ul>
        </section>

        <section className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/resources/register">Add your API</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/discovery/spec">Read the spec</Link>
          </Button>
        </section>
      </Body>
    </div>
  );
}
