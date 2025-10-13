'use client';

import React, { useState } from 'react';

import { Loader2 } from 'lucide-react';

import { useVerifyEmailOTP } from '@coinbase/cdp-hooks';

import { useMutation } from '@tanstack/react-query';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';

interface Props {
  flowId: string;
  handleReset: () => void;
}

export const EmbeddedWalletOTP: React.FC<Props> = ({ flowId, handleReset }) => {
  const [otp, setOtp] = useState('');

  const { verifyEmailOTP } = useVerifyEmailOTP();

  const {
    mutateAsync: verifyOTP,
    isPending: isVerifyingOTP,
    error: verifyOTPError,
    isSuccess: verifyOTPSuccess,
  } = useMutation({
    mutationFn: async ({ flowId, otp }: { flowId: string; otp: string }) => {
      return verifyEmailOTP({
        flowId,
        otp,
      });
    },
    onSuccess: () => {
      toast.success('Signed in successfully');
    },
    onError: () => {
      toast.error('OTP verification failed');
    },
  });

  const otpGroupProps = (isSuccess: boolean) => {
    return {
      className: cn(
        'flex-1 rounded-md',
        isSuccess && 'shadow-[0_0_8px_var(--color-green-600)]'
      ),
    };
  };

  const otpSlotProps = (isSuccess: boolean) => {
    return {
      className: cn('h-12 flex-1 text-xl', isSuccess && 'border-green-600'),
    };
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp">OTP Code</Label>
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          containerClassName="w-full"
        >
          <InputOTPGroup {...otpGroupProps(verifyOTPSuccess)}>
            <InputOTPSlot index={0} {...otpSlotProps(verifyOTPSuccess)} />
            <InputOTPSlot index={1} {...otpSlotProps(verifyOTPSuccess)} />
            <InputOTPSlot index={2} {...otpSlotProps(verifyOTPSuccess)} />
          </InputOTPGroup>
          <InputOTPSeparator
            className={cn(verifyOTPSuccess && 'text-green-600')}
          />
          <InputOTPGroup {...otpGroupProps(verifyOTPSuccess)}>
            <InputOTPSlot index={3} {...otpSlotProps(verifyOTPSuccess)} />
            <InputOTPSlot index={4} {...otpSlotProps(verifyOTPSuccess)} />
            <InputOTPSlot index={5} {...otpSlotProps(verifyOTPSuccess)} />
          </InputOTPGroup>
        </InputOTP>
        {verifyOTPError ? (
          <p className="text-muted-foreground text-xs">
            {verifyOTPError.message}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Check your email for the OTP code
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => verifyOTP({ flowId, otp })}
          disabled={isVerifyingOTP || verifyOTPSuccess || otp.length !== 6}
          className="h-12 md:h-12"
          variant="turbo"
        >
          {isVerifyingOTP || verifyOTPSuccess ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {verifyOTPSuccess ? 'Logging in...' : 'Verifying...'}
            </>
          ) : (
            'Verify OTP'
          )}
        </Button>
        <Button onClick={handleReset} variant="ghost" disabled={isVerifyingOTP}>
          Back
        </Button>
      </div>
    </div>
  );
};
