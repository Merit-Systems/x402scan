'use client';

import {
  useCurrentUser,
  useIsInitialized,
  useSignOut,
} from '@coinbase/cdp-hooks';
import { signOut, useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';

import { useBalance } from '@/app/_hooks/use-balance';

import { CopyCode } from '@/components/ui/copy-code';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { useDisconnect } from 'wagmi';
import { ConnectedWallets } from '@/app/_hooks/use-connected-wallets';

import type { User } from '@coinbase/cdp-hooks';
import { useSolanaWallet } from '@/app/_contexts/solana/hook';

interface Props {
  address: string;
  user?: User;
}

export const WalletContent: React.FC<Props> = ({ user, address }) => {
  const { data: balance, isLoading } = useBalance();

  const { data: session, status } = useSession();

  const { isInitialized } = useIsInitialized();
  const { currentUser } = useCurrentUser();
  const { signOut: signOutWallet } = useSignOut();
  const { disconnect } = useSolanaWallet();

  const { disconnectAsync } = useDisconnect();

  const { mutateAsync: handleSignOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      if (isInitialized && currentUser) {
        await signOutWallet();
      } else {
        await disconnectAsync();
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
        label="Balance"
        value={
          isLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <p className="bg-muted rounded-md border p-2">{balance} USDC</p>
          )
        }
      />
      <ItemContainer
        label="Address"
        value={
          <CopyCode code={address} toastMessage="Address copied to clipboard" />
        }
      />
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

const ItemContainer = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium font-mono">{label}</p>
      {value}
    </div>
  );
};

const AuthenticationMethod = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <ItemContainer
      label={label}
      value={<p className="border rounded-md p-2 bg-muted">{value}</p>}
    />
  );
};
