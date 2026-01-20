'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/trpc/client';

export const CreateInviteCodeButton = () => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('1');
  const [uniqueRecipients, setUniqueRecipients] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');

  const utils = api.useUtils();

  const createMutation = api.admin.inviteCodes.create.useMutation({
    onSuccess: () => {
      void utils.admin.inviteCodes.list.invalidate();
      setOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setCode('');
    setAmount('');
    setMaxRedemptions('1');
    setUniqueRecipients(false);
    setExpiresAt('');
    setNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    // Convert datetime-local value to ISO format with timezone
    let expiresAtISO: string | undefined;
    if (expiresAt) {
      expiresAtISO = new Date(expiresAt).toISOString();
    }

    createMutation.mutate({
      code: code || undefined,
      amount,
      maxRedemptions: parseInt(maxRedemptions) || 1,
      uniqueRecipients,
      expiresAt: expiresAtISO,
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invite Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Invite Code</DialogTitle>
          <DialogDescription>
            Create a new invite code that rewards users with USDC when redeemed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code (Optional)</Label>
            <Input
              id="code"
              placeholder="WELCOME10 (auto-generated if empty)"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate a code like X4-XXXXX
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="10"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Amount of USDC to send when code is redeemed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRedemptions">Max Redemptions</Label>
            <Input
              id="maxRedemptions"
              type="number"
              min="0"
              placeholder="1"
              value={maxRedemptions}
              onChange={e => setMaxRedemptions(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              0 = unlimited redemptions
            </p>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Unique Recipients Only</Label>
              <p className="text-xs text-muted-foreground">
                Each wallet can only redeem this code once
              </p>
            </div>
            <Checkbox
              checked={uniqueRecipients}
              onCheckedChange={checked => setUniqueRecipients(checked === true)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Internal note about this invite code..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !amount}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
