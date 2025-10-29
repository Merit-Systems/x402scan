import { Body, Heading } from '@/app/_components/layout/page-utils';
import { TestEndpointForm } from '../_components/form';

export default function DeveloperPage() {
  return (
    <div>
      <Heading
        title="Resource Preview"
        description="Quickly preview an x402 endpoint directly to see how it will appear in the x402scan app."
      />
      <Body>
        <TestEndpointForm />
      </Body>
    </div>
  );
}
