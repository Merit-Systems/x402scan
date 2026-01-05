'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  resourceUrl: string;
};

export const ResourceHeader: React.FC<Props> = ({ resourceUrl }) => {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const handleBack = () => {
    router.push(`/server/${serverId}/observability`);
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
