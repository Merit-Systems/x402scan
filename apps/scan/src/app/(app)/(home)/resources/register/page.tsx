import { Body, Heading } from '@/app/_components/layout/page-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RegisterResourceForm } from './_components/form';
import { OpenApiUpload } from './_components/openapi-upload';

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
              Register your x402-compatible server to make your resources
              discoverable on x402scan.
            </p>
            <div>
              <Button asChild size="sm" variant="outline" className="gap-1">
                <Link href="/discovery">
                  Read the Discovery Spec
                  <span aria-hidden>→</span>
                </Link>
              </Button>
            </div>
          </div>
        }
      />
      <Body className="space-y-6">
        <RegisterResourceForm />
        <OpenApiUpload />
      </Body>
    </div>
  );
}
