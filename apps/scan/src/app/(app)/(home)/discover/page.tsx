import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import Content from './content.mdx';

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
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Content />
            </div>
          </CardContent>
        </Card>
      </Body>
    </div>
  );
}
