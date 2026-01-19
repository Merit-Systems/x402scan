'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/client';

import type { Address } from 'viem';

interface Props {
  address: Address;
}

export const InviteCodeRedemption: React.FC<Props> = ({ address }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);

  const redeemMutation = api.public.invite.redeem.useMutation({
    onSuccess: data => {
      if (data.success) {
        setStatus('success');
        setMessage('Invite code redeemed successfully!');
        setTxHash(data.txHash ?? null);
        setAmount(data.amount ?? null);
        setCode('');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Failed to redeem invite code');
      }
    },
    onError: error => {
      setStatus('error');
      setMessage(error.message ?? 'Failed to redeem invite code');
    },
  });

  const handleRedeem = () => {
    if (!code.trim()) return;

    setStatus('idle');
    setMessage(null);
    setTxHash(null);
    setAmount(null);

    redeemMutation.mutate({
      code: code.trim(),
      recipientAddr: address,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter invite code"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleRedeem();
            }
          }}
          className="font-mono"
          disabled={redeemMutation.isPending}
        />
        <Button
          onClick={handleRedeem}
          disabled={!code.trim() || redeemMutation.isPending}
        >
          {redeemMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Redeem'
          )}
        </Button>
      </div>

      {status === 'success' && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {message}
            </p>
            {amount && (
              <p className="text-sm text-green-700 dark:text-green-300">
                You received <span className="font-bold">{amount} USDC</span>
              </p>
            )}
            {txHash && (
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 dark:text-green-400 underline hover:no-underline"
              >
                View transaction
              </a>
            )}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
        </div>
      )}
    </div>
  );
};
