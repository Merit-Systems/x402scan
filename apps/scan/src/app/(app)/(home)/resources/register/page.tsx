import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Card, CardContent } from '@/components/ui/card';
import { DiscoveryActions } from './_components/discovery-actions';
import { RegisterResourceForm } from './_components/form';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add API',
  description: 'Register your x402-compatible API on x402scan.',
};

export default function RegisterResourcePage() {
  return (
    <div>
      <Heading
        title="Add your API"
        description={
          <div className="space-y-2">
            <p>
              Register your x402-compatible API to make your resources
              discoverable on x402scan.
            </p>
            <DiscoveryActions />
          </div>
        }
      />
      <Body>
        <p className="text-sm text-muted-foreground">
          Need help? Join this{' '}
          <a
            href="https://t.me/+wj2U7LRDRGs5MTY6"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline text-foreground"
          >
            Telegram group
          </a>{' '}
          if you have any questions
          , or email us at{' '}
          <a
            href="mailto:merchants@merit.systems"
            className="underline hover:no-underline text-foreground"
          >
            merchants@merit.systems
          </a>
          .
        </p>
        <Link href="/discovery">
          <Card className="transition-colors hover:border-foreground/20">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex items-center justify-center size-10 rounded-full bg-muted shrink-0">
                <BookOpen className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">
                  New to x402? Start here
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quickstart prompts, the OpenAPI spec, and a proxy pattern for
                  adding agent payments without restructuring your backend.
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
        <RegisterResourceForm />
      </Body>
    </div>
  );
}
