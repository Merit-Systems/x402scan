import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discovery Spec',
  description:
    'x402scan discovery and registration specification for OpenAPI, well-known, DNS, and endpoint-only compatibility.',
};

export default function DiscoverySpecPage() {
  return (
    <div>
      <Heading
        title="Discovery Spec"
        description="How to make your server discoverable and registerable in x402scan."
      />
      <Body>
        <Card>
          <CardHeader>
            <CardTitle>Preferred Discovery Order</CardTitle>
            <CardDescription>
              Implement in this order: OpenAPI, then <code>/.well-known/x402</code>, then DNS
              <code> _x402</code>.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-8 text-sm md:text-base">
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Discovery Precedence</h2>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    OpenAPI (<code>/openapi.json</code>, then{' '}
                    <code>/.well-known/openapi.json</code>)
                  </li>
                  <li>
                    <code>/.well-known/x402</code>
                  </li>
                  <li>DNS TXT pointer at <code>_x402</code></li>
                </ol>
                <p className="text-muted-foreground">
                  Runtime <code>402</code> challenge behavior is authoritative.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">OpenAPI-First (Recommended)</h2>
                <p>Required top-level fields:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <code>openapi</code> (string)
                  </li>
                  <li>
                    <code>info.title</code> and <code>info.version</code>
                  </li>
                  <li>
                    <code>paths</code> (object)
                  </li>
                </ul>
                <p>For paid operations:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    declare <code>x-payment-info</code>
                  </li>
                  <li>
                    include a <code>402</code> response
                  </li>
                  <li>
                    include <code>x-payment-info.protocols</code> (for example <code>x402</code>)
                  </li>
                  <li>
                    include pricing mode: <code>fixed</code>, <code>range</code>, or{' '}
                    <code>quote</code>
                  </li>
                </ul>
                <p>
                  Auth should use OpenAPI <code>security</code> +{' '}
                  <code>components.securitySchemes</code>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Well-Known Fan-Out (Compatibility)</h2>
                <p>
                  Host <code>GET /.well-known/x402</code> with a v1 payload:
                </p>
                <pre className="rounded-md border bg-muted p-3 overflow-x-auto text-xs">
                  <code>{`{
  "version": 1,
  "resources": [
    "https://yourdomain.com/api/route-1",
    "https://yourdomain.com/api/route-2"
  ]
}`}</code>
                </pre>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">DNS Pointer (Compatibility)</h2>
                <pre className="rounded-md border bg-muted p-3 overflow-x-auto text-xs">
                  <code>{`_x402.yourdomain.com TXT "v=x4021;url=https://yourdomain.com/.well-known/x402"`}</code>
                </pre>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold">Endpoint-Only Fallback</h2>
                <p>
                  If you cannot expose discovery yet, endpoint registration still works as long as
                  the route returns a parseable <code>402</code> challenge.
                </p>
                <pre className="rounded-md border bg-muted p-3 overflow-x-auto text-xs">
                  <code>{`curl -i -X POST https://yourdomain.com/api/route
curl -i -X GET https://yourdomain.com/api/route`}</code>
                </pre>
              </section>
            </div>
          </CardContent>
        </Card>
      </Body>
    </div>
  );
}
