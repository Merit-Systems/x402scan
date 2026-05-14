import { Body, Heading } from '@/app/_components/layout/page-utils';
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
          Need help?{' '}
          <a
            href="https://t.me/+wj2U7LRDRGs5MTY6"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline text-foreground"
          >
            Join this Telegram group if you have any questions.
          </a>
        </p>
        <RegisterResourceForm />
      </Body>
    </div>
  );
}
