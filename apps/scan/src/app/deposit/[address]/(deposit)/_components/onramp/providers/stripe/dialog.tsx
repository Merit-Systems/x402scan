'use client';

import { use, useEffect, useRef } from 'react';

import { loadStripeOnramp } from '@stripe/crypto';

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
  const [clientSecret] = api.onramp.stripe.getSession.useSuspenseQuery({
    amount: quote,
    address,
  });
  const onramp = use(stripeOnrampPromise);

  const onrampElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerRef = onrampElementRef.current;
    if (containerRef) {
      containerRef.innerHTML = '';

      if (clientSecret && onramp) {
        onramp
          .createSession({
            clientSecret,
            appearance: {
              theme: 'light',
            },
          })
          .mount(containerRef);
      }
    }
  }, [clientSecret, onramp]);

  return (
    <div className="relative">
      <Loader2 className="size-4 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div ref={onrampElementRef} />
    </div>
  );
};
