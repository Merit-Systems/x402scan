import { Body, Heading } from '@/app/_components/layout/page-utils';
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
        description="Register your x402-compatible server to make your resources discoverable on x402scan."
      />
      <Body>
        <RegisterResourceForm />
      </Body>
    </div>
  );
}
