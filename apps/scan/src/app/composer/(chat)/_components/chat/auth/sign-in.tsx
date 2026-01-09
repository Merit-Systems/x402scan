import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export const SignIn = () => {
  return (
    <div>
      <div className="p-4">
        <Button
          onClick={() => void signIn('permi')}
          className="w-full"
          variant="turbo"
          size="lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.permi.xyz/logo.svg"
            alt="Permi"
            className="size-4"
          />
          Sign In with Permi
        </Button>
      </div>
      <div className="p-4 border-t bg-muted text-xs text-muted-foreground font-mono text-center">
        <p>x402scan uses Permi to manage agentic wallets</p>
      </div>
    </div>
  );
};
