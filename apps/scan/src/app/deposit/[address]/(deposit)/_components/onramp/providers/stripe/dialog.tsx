'use client';

import { useEffect, useRef, useState } from 'react';

import { loadStripeOnramp } from '@stripe/crypto';
import type { StripeOnramp } from '@stripe/crypto';

import { api } from '@/trpc/client';

import { env } from '@/env';
import type { OnrampProviderDialogContentProps } from '../types';
import { Loader2 } from 'lucide-react';

const stripeOnrampPromise = loadStripeOnramp(
  env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export const StripeOnrampDialogContent: React.FC<
  OnrampProviderDialogContentProps
> = ({ quote, address }) => {
  const [onramp, setOnramp] = useState<StripeOnramp | null>(null);

  const { data: clientSecret, error: sessionError } =
    api.onramp.stripe.getSession.useQuery({
      amount: quote,
      address,
    });

  const onrampElementRef = useRef<HTMLDivElement>(null);

  // Load Stripe onramp
  useEffect(() => {
    if (onramp === null) {
      void stripeOnrampPromise.then(stripeOnramp => {
        setOnramp(stripeOnramp);
      });
    }
  }, [onramp]);

  // Mount Stripe onramp session
  useEffect(() => {
    const containerRef = onrampElementRef.current;
    if (containerRef && clientSecret && onramp) {
      containerRef.innerHTML = '';

      onramp
        .createSession({
          clientSecret,
          appearance: {
            theme: 'light',
          },
        })
        .mount(containerRef);
    }
  }, [clientSecret, onramp]);

  if (sessionError) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        Failed to create onramp session. Please try again.
      </div>
    );
  }

  return (
    <div className="relative min-h-[574px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
      <div ref={onrampElementRef} />
    </div>
  );
};
