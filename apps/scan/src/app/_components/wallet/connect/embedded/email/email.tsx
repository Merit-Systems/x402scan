'use client';

import React, { useState } from 'react';

import { Loader2 } from 'lucide-react';

import { useSignInWithEmail } from '@coinbase/cdp-hooks';

import { useMutation } from '@tanstack/react-query';

import { toast } from 'sonner';
import { z } from 'zod';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface Props {
  setFlowId: (flowId: string) => void;
}

export const EmbeddedWalletEmail: React.FC<Props> = ({ setFlowId }) => {
  const [email, setEmail] = useState('');

  const { signInWithEmail } = useSignInWithEmail();

  const {
    mutate: signIn,
    isPending: isSigningIn,
    error: signInError,
  } = useMutation({
    mutationFn: async (email: string) => {
      return signInWithEmail({ email });
    },
    onSuccess: (data, email) => {
      setFlowId(data.flowId);
      toast.success(`A One-Time Password has been sent to ${email}`);
    },
    onError: () => {
      toast.error('Sign in failed');
    },
  });

  const handleSignIn = async () => {
    if (!email) {
      toast.error('Email is required');
      return;
    }
    if (!z.email().safeParse(email).success) {
      toast.error('Invalid email');
      return;
    }
    signIn(email);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="richard@piedpiper.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isSigningIn}
          className={cn(signInError && 'border-destructive')}
        />
        {signInError && (
          <p className="text-sm text-red-500">{signInError.message}</p>
        )}
      </div>
      <Button
        onClick={handleSignIn}
        disabled={isSigningIn || !z.email().safeParse(email).success}
        className="w-full"
        variant={'turbo'}
      >
        {isSigningIn ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          'Send OTP'
        )}
      </Button>
    </div>
  );
};
