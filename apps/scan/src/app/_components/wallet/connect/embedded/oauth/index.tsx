import Image from 'next/image';

import { useSignInWithOAuth } from '@coinbase/cdp-hooks';

import { Button } from '@/components/ui/button';

export const ConnectEmbeddedWalletOAuth = () => {
  const { signInWithOAuth } = useSignInWithOAuth();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={() => signInWithOAuth('google')}
        className="w-full h-12 md:h-12"
      >
        <Image src="/google.png" alt="Google" width={16} height={16} />
        Continue with Google
      </Button>
      <Button
        variant="outline"
        onClick={() => signInWithOAuth('apple')}
        className="w-full h-12 md:h-12"
      >
        <Image
          src="/apple.png"
          alt="Apple"
          width={16}
          height={16}
          className="size-4 dark:invert"
        />
        Continue with Apple
      </Button>
    </div>
  );
};
