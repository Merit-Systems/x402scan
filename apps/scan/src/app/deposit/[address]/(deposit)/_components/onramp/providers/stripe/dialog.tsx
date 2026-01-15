'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { loadStripeOnramp } from '@stripe/crypto';

import { api } from '@/trpc/client';

import { env } from '@/env';
import { Loader2 } from 'lucide-react';

import type { OnrampProviderDialogContentProps } from '../types';
import type {
  OnrampSession,
  OnrampSessionResult,
  OnrampUIEventMap,
  StripeOnramp,
} from '@stripe/crypto';
import { OnrampProviders } from '@/services/onramp/types';
import type { Route } from 'next';

const stripeOnrampPromise = loadStripeOnramp(
  env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export const StripeOnrampDialogContent: React.FC<
  OnrampProviderDialogContentProps
> = ({ quote, address }) => {
  const router = useRouter();

  const [onramp, setOnramp] = useState<StripeOnramp | null>(null);
  const [session, setSession] = useState<OnrampSession | null>(null);

  const { data: clientSecret, error: sessionError } =
    api.onramp.stripe.session.create.useQuery({
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

      const session = onramp
        .createSession({
          clientSecret,
          appearance: {
            theme: 'light',
          },
        })
        .mount(containerRef);

      setSession(session);
    }
  }, [clientSecret, onramp]);

  useOnrampSessionListener({
    type: 'onramp_session_updated',
    session,
    callback: session => {
      if (session.status === 'fulfillment_processing') {
        setTimeout(() => {
          router.push(
            `/deposit/${address}/${OnrampProviders.STRIPE}?id=${session.id}` as Route
          );
        }, 3000);
      }
    },
  });

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

interface UseOnrampSessionListenerProps {
  type: keyof OnrampUIEventMap;
  session: OnrampSession | null;
  callback: (payload: OnrampSessionResult) => void;
}

const useOnrampSessionListener = ({
  type,
  session,
  callback,
}: UseOnrampSessionListenerProps) => {
  useEffect(() => {
    if (session && callback) {
      const listener = (e: OnrampUIEventMap[typeof type]) =>
        callback(e.payload.session);
      session.addEventListener(type, listener);
      return () => {
        session.removeEventListener(type, listener);
      };
    }
    return () => {
      /* noop */
    };
  }, [session, callback, type]);
};
