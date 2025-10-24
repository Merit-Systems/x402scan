import { Body, Heading } from '@/app/_components/layout/page-utils';
import { RegisterResourceForm } from './_components/form';
import { OpenAPIUploadForm } from './_components/openapi-form';
import { OutputSchema } from './_components/schema';

export default function RegisterResourcePage() {
  return (
    <div>
      <Heading
        title="Register Resource"
        description="Add resources to be tracked by x402scan."
      />
      <Body>
        <div className="space-y-8">
          <RegisterResourceForm />
          <OpenAPIUploadForm />
          <OutputSchema />
        </div>
      </Body>
    </div>
  );
}