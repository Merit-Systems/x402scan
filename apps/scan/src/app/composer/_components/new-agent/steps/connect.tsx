import { ConnectWalletForm } from '@/app/_components/wallet/connect/form';
import { useSignIn } from '@/app/_hooks/use-sign-in';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';

export const ConnectStep = () => {
  const { address } = useAccount();

  if (!address) {
    return (
      <div className="p-4 flex flex-col gap-2">
        <ConnectWalletForm />
      </div>
    );
  }

  return <Verify />;
};

const Verify = () => {
  const { signIn, isPending } = useSignIn();

  return (
    <div className="flex flex-col gap-4 pt-4 ">
      <div className="px-4">
        <Button
          onClick={() => signIn()}
          disabled={isPending}
          className="w-full h-12 md:h-12"
          variant="turbo"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Sign Message'
          )}
        </Button>
      </div>
      <div className="p-4 bg-muted border-t">
        <p className="text-muted-foreground text-xs text-center font-mono">
          Sign a message to confirm you own this wallet and create a server
          wallet for your agent. This will refresh the page.
        </p>
      </div>
    </div>
  );
};
