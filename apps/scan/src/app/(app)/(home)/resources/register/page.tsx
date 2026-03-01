import { Body, Heading } from '@/app/_components/layout/page-utils';
import { RegisterResourceForm } from './_components/form';
import Link from 'next/link';

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
          <>
            Register your x402-compatible server to make your resources discoverable on
            x402scan.{' '}
            <Link href="/discovery" className="underline hover:no-underline">
              Read the discovery spec
            </Link>
            .
          </>
        }
      />
      <Body>
        <RegisterResourceForm />
      </Body>
    </div>
  );
}
