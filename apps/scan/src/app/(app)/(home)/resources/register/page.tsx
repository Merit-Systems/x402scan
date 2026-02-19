import { Body, Heading } from '@/app/_components/layout/page-utils';
import { RegisterResourceForm } from './_components/form';
import { OutputSchema } from './_components/schema';
import { DeveloperToolBanner } from './_components/developer-tool-banner';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Resource',
  description: 'Add a resource to be tracked by x402scan.',
};

export default function RegisterResourcePage() {
  return (
    <div>
      <Heading
        title="Register Resource"
        description="Add a resource to be tracked by x402scan."
      />
      <Body>
        <DeveloperToolBanner />
        <RegisterResourceForm />
        <OutputSchema />
      </Body>
    </div>
  );
}
