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
import { PartnerCollapsible, type PartnerData } from './partner-collapsible';

export const CreateInviteCodeButton = () => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('5');
  const [maxRedemptions, setMaxRedemptions] = useState('1');
  const [uniqueRecipients, setUniqueRecipients] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [partnerData, setPartnerData] = useState<PartnerData>({
    partnerName: '',
    partnerMeritContact: '',
    partnerEmail: '',
    partnerOrganization: '',
  });

  const utils = api.useUtils();

  const createMutation = api.admin.inviteCodes.create.useMutation({
    onSuccess: () => {
      void utils.admin.inviteCodes.list.invalidate();
      void utils.admin.partners.list.invalidate();
      setOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setCode('');
    setAmount('5');
    setMaxRedemptions('1');
    setUniqueRecipients(true);
    setExpiresAt('');
    setNote('');
    setPartnerData({
      partnerName: '',
      partnerMeritContact: '',
      partnerEmail: '',
      partnerOrganization: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    // Convert datetime-local value to ISO format with timezone
    let expiresAtISO: Date | undefined;
    if (expiresAt) {
      expiresAtISO = new Date(expiresAt);
    }

    createMutation.mutate({
      code: code || undefined,
      amount,
      maxRedemptions: parseInt(maxRedemptions) || 1,
      uniqueRecipients,
      expiresAt: expiresAtISO,
      note: note || undefined,
      partnerName: partnerData.partnerName || undefined,
      partnerMeritContact: partnerData.partnerMeritContact || undefined,
      partnerEmail: partnerData.partnerEmail || undefined,
      partnerOrganization: partnerData.partnerOrganization || undefined,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Invite Code</DialogTitle>
          <DialogDescription>
            Create a new invite code that rewards users with USDC when redeemed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <PartnerCollapsible onPartnerChange={setPartnerData} />

            <div className="space-y-2">
              <Label htmlFor="code">Code (Optional)</Label>
              <Input
                id="code"
                placeholder="WELCOME10 (auto-generated if empty)"
                value={code}
                onChange={e =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate a code like MRTXXXXX
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
                onCheckedChange={checked =>
                  setUniqueRecipients(checked === true)
                }
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
          </div>

          <DialogFooter className="mt-4">
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
