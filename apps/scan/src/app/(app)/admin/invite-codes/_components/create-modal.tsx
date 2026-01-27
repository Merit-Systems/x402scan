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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/trpc/client';

export const CreateInviteCodeButton = () => {
  const [open, setOpen] = useState(false);
  const [createPartnerOpen, setCreatePartnerOpen] = useState(false);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('1');
  const [uniqueRecipients, setUniqueRecipients] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [partnerId, setPartnerId] = useState<string>('');

  // Partner creation form state
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerOrganization, setPartnerOrganization] = useState('');
  const [partnerMeritContact, setPartnerMeritContact] = useState('');

  const utils = api.useUtils();

  const { data: partners } = api.admin.partners.list.useQuery();

  const createPartnerMutation = api.admin.partners.create.useMutation({
    onSuccess: newPartner => {
      void utils.admin.partners.list.invalidate();
      setPartnerId(newPartner.id);
      setCreatePartnerOpen(false);
      resetPartnerForm();
    },
  });

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
    setUniqueRecipients(true);
    setExpiresAt('');
    setNote('');
    setPartnerId('');
  };

  const resetPartnerForm = () => {
    setPartnerName('');
    setPartnerEmail('');
    setPartnerOrganization('');
    setPartnerMeritContact('');
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    createPartnerMutation.mutate({
      name: partnerName,
      email: partnerEmail,
      organization: partnerOrganization,
      merit_contact: partnerMeritContact,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !partnerId) return;

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
      partnerId,
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
            <Label htmlFor="partner">
              Partner <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={partnerId} onValueChange={setPartnerId} required>
                <SelectTrigger className="w-full" id="partner">
                  <SelectValue placeholder="Select a partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners?.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} {partner.organization && `(${partner.organization})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreatePartnerOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a partner or create a new one
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code (Optional)</Label>
            <Input
              id="code"
              placeholder="WELCOME10 (auto-generated if empty)"
              value={code}
              onChange={e =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
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
              disabled={createMutation.isPending || !amount || !partnerId}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>

        {/* Create Partner Dialog */}
        <Dialog open={createPartnerOpen} onOpenChange={setCreatePartnerOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Partner</DialogTitle>
              <DialogDescription>
                Create a new partner before generating the invite code.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partnerName">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partnerName"
                  placeholder="John Doe"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerEmail">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={partnerEmail}
                  onChange={e => setPartnerEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerOrganization">
                  Organization <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partnerOrganization"
                  placeholder="Acme Inc"
                  value={partnerOrganization}
                  onChange={e => setPartnerOrganization(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerMeritContact">
                  Merit Contact <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partnerMeritContact"
                  placeholder="Contact name at Merit"
                  value={partnerMeritContact}
                  onChange={e => setPartnerMeritContact(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreatePartnerOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createPartnerMutation.isPending ||
                    !partnerName ||
                    !partnerEmail ||
                    !partnerOrganization ||
                    !partnerMeritContact
                  }
                >
                  {createPartnerMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
