import { Body, Heading } from '@/app/_components/layout/page-utils';
import Link from 'next/link';
import { RegisterResourceForm } from './_components/form';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Server',
  description: 'Register your x402-compatible server on x402scan.',
};

export default function RegisterResourcePage() {
  return (
    <div>
      <Heading
        title="Add your Server"
        description={
          <div className="space-y-2">
            <p>
              Register your x402-compatible server to make your resources discoverable on
              x402scan.
            </p>
            <div>
              <Link
                href="/discovery"
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/20"
              >
                Read the Discovery Spec
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        }
      />
      <Body>
        <RegisterResourceForm />
      </Body>
    </div>
  );
}
