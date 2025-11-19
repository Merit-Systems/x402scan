'use client';

import { Loader2 } from 'lucide-react';

import {
  useCurrentUser,
  useIsInitialized,
  useSignOut,
} from '@coinbase/cdp-hooks';
import { signOut, useSession } from 'next-auth/react';

import { useConnections } from 'wagmi';

import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { CopyCode } from '@/components/ui/copy-code';

import { AuthenticationMethod, ItemContainer } from './item';
import { Balance } from './balance';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import type { User } from '@coinbase/cdp-hooks';

interface Props {
  address: string;
  user?: User;
}

export const WalletContent: React.FC<Props> = ({ user, address }) => {
  const { data: session, status } = useSession();

  const { isInitialized } = useIsInitialized();
  const { currentUser } = useCurrentUser();
  const { signOut: signOutWallet } = useSignOut();
  const { disconnect } = useSolanaWallet();

  const connections = useConnections();

  const { mutateAsync: handleSignOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      if (isInitialized && currentUser) {
        await signOutWallet();
      } else {
        await Promise.all(
          connections.map(connection => connection.connector.disconnect())
        );
        disconnect();
      }
      if (session) {
        await signOut();
      }
    },
  });

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <ItemContainer
        label="Address"
        value={
          <CopyCode
            code={address}
            toastMessage="Address copied to clipboard"
            isLoading={false}
          />
        }
      />
      <Balance address={address} />
      {user?.authenticationMethods.email?.email && (
        <AuthenticationMethod
          label="Email"
          value={user.authenticationMethods.email.email}
        />
      )}
      {user?.authenticationMethods.sms?.phoneNumber && (
        <AuthenticationMethod
          label="Phone Number"
          value={user.authenticationMethods.sms.phoneNumber}
        />
      )}
      {user?.authenticationMethods?.google && (
        <AuthenticationMethod
          label="Google"
          value={user.authenticationMethods.google.email ?? 'Unknown Email'}
        />
      )}
      {user?.authenticationMethods?.apple && (
        <AuthenticationMethod
          label="Apple"
          value={user.authenticationMethods.apple.email ?? 'Unknown Email'}
        />
      )}
      <Button
        onClick={() => handleSignOut()}
        className="w-full"
        disabled={!isInitialized || isSigningOut || status === 'loading'}
      >
        {isSigningOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          'Disconnect'
        )}
      </Button>
    </div>
  );
};
