'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  resourceUrl: string;
}

export const ResourceHeader: React.FC<Props> = ({ resourceUrl }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('resource');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="mb-2 -ml-2 flex gap-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {resourceUrl}
      </Button>
    </div>
  );
};
