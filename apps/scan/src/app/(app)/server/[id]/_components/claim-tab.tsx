'use client';

import { useState } from 'react';

import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePostHog } from 'posthog-js/react';
import { useRouter } from 'next/navigation';

import { api } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { MissingContactEmailWarning } from '@/app/(app)/_components/discovery/missing-contact-email-warning';
import { CLAIM_CODE_DIGITS } from '@/services/claim/constants';

interface Props {
  originId: string;
  origin: string;
  originHostname: string;
  isOwner: boolean;
}

const VERIFY_ERROR_MESSAGES: Record<string, string> = {
  wrong_code: 'Incorrect code. Please try again.',
  expired: 'That code expired. Request a new one.',
  too_many_attempts: 'Too many attempts. Request a new code.',
  invalid: 'That code is no longer valid. Request a new one.',
};

// Glossy "v2"-style fill (gradient + shimmer) in the bookmark shape: flat top
// flush against the Overview divider, rounded bottom. `after:hidden` drops the
// fancy variant's rounded-full inset glow, which otherwise reads as an inner pill.
const TAB_CLASS = cn(
  badgeVariants({ variant: 'fancy' }),
  'pointer-events-auto gap-1 rounded-t-none rounded-b-md border-none px-2.5 py-0.5 text-xs font-medium shadow-md after:hidden'
);

export const ClaimTab: React.FC<Props> = ({
  originId,
  origin,
  originHostname,
  isOwner,
}) => {
  const router = useRouter();
  const posthog = usePostHog();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'intro' | 'code'>('intro');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Check the live openapi.json for a contact email when the dialog opens, so we
  // can disable "Send code" up-front instead of after a round-trip. Only fetches
  // on open (not per pageview); cached briefly to absorb reopen/resend.
  const discovery = api.public.resources.checkDiscovery.useQuery(
    { origin, bustCache: false },
    { enabled: open && step === 'intro', retry: false, staleTime: 30_000 }
  );
  const checkingEmail = discovery.isLoading || discovery.isFetching;
  const hasContactEmail = discovery.data?.found
    ? Boolean(discovery.data.contactEmail)
    : false;
  const noContactEmail = discovery.isFetched && !hasContactEmail;

  const requestMutation = api.public.claim.request.useMutation({
    onSuccess: ({ maskedEmail }) => {
      setMaskedEmail(maskedEmail);
      setStep('code');
      posthog?.capture('claim:code_sent', { origin_id: originId });
    },
    onError: error => {
      toast.error(error.message || 'Could not send the code.');
    },
  });

  const resetAndClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep('intro');
      setCode('');
    }
  };

  const handleVerify = async (submittedCode: string) => {
    setVerifying(true);
    try {
      const res = await fetch('/api/claim/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ originId, code: submittedCode }),
      });
      if (res.ok) {
        posthog?.capture('claim:verify_success', { origin_id: originId });
        toast.success('You now manage this origin.');
        resetAndClose(false);
        // Re-runs the server layout, which re-resolves ownership from the
        // freshly-set claim cookie and flips this tab to the owner state.
        router.refresh();
        return;
      }
      const data: unknown = await res.json().catch(() => null);
      const reason =
        data && typeof data === 'object' && 'error' in data
          ? String((data as { error: unknown }).error)
          : 'invalid';
      posthog?.capture('claim:verify_fail', { origin_id: originId, reason });
      toast.error(VERIFY_ERROR_MESSAGES[reason] ?? 'Verification failed.');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  if (isOwner) {
    // Calm bookmark once claimed — no gradient/glow competing for attention.
    return (
      <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-b-md border border-t-0 border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
        <Check className="size-3" />
        You manage this origin
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(TAB_CLASS, 'transition hover:brightness-110')}
          onClick={() =>
            posthog?.capture('claim:modal_view', { origin_id: originId })
          }
        >
          Claim this origin
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim {originHostname}</DialogTitle>
          <DialogDescription>
            {step === 'intro'
              ? 'Prove you control this origin by verifying the contact email in its openapi.json.'
              : `Enter the 6-digit code we sent to ${maskedEmail}.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'intro' ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ll email a one-time code to the address listed under{' '}
              <code className="text-foreground">info.contact.email</code> in
              this origin&apos;s live openapi.json.
            </p>
            {noContactEmail ? <MissingContactEmailWarning /> : null}
            <Button
              className="w-full"
              disabled={
                requestMutation.isPending || checkingEmail || noContactEmail
              }
              onClick={() => requestMutation.mutate({ originId })}
            >
              {requestMutation.isPending || checkingEmail ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Send code'
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={CLAIM_CODE_DIGITS}
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
              disabled={verifying}
            >
              <InputOTPGroup>
                {Array.from({ length: CLAIM_CODE_DIGITS }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {verifying ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                className="text-muted-foreground"
                disabled={requestMutation.isPending}
                onClick={() => requestMutation.mutate({ originId })}
              >
                Didn&apos;t get it? Resend
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
