import { WelcomeContent } from './content';

import { auth } from '@/auth';

import { api } from '@/trpc/server';

export const Onboarding = async () => {
  const [isSignedIn, hasUsdcBalance] = await Promise.all([
    auth()
      .then(Boolean)
      .catch(() => false),
    api.serverWallet
      .usdcBaseBalance()
      .then(data => Boolean(data && data > 0))
      .catch(() => false),
  ]);

  if (isSignedIn && hasUsdcBalance) {
    return null;
  }

  const initialStep = !isSignedIn ? 1 : 2;

  return <WelcomeContent initialStep={initialStep} />;
};
