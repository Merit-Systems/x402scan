'use client';

import { useState } from 'react';

import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface Props {
  token: string;
  originId: string;
}

export const ConfirmClaim: React.FC<Props> = ({ token, originId }) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/claim/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        toast.success('You now manage this origin.');
        router.push(`/server/${originId}`);
        router.refresh();
        return;
      }
      toast.error('This link is no longer valid. Request a new code.');
      setSubmitting(false);
    } catch {
      toast.error('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Button
      className="w-full gap-2"
      disabled={submitting}
      onClick={() => void handleConfirm()}
    >
      {submitting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          <ShieldCheck className="size-4" />
          Confirm claim
        </>
      )}
    </Button>
  );
};
