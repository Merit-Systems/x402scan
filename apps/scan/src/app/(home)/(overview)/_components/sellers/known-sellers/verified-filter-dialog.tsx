'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useVerifiedFilter } from '@/app/_contexts/verified-filter/hook';
import { CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VerifiedFilterDialog = ({ open, onOpenChange }: Props) => {
  const { verifiedOnly, setVerifiedOnly } = useVerifiedFilter();

  const handleToggle = () => {
    setVerifiedOnly(!verifiedOnly);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="size-4 text-green-500" />
            Verified Servers Filter
          </DialogTitle>
          <DialogDescription>
            Filter servers to only show those with verified accepts. Volume and
            metrics are recalculated to only include transactions to verified
            addresses.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-4">
          <Label htmlFor="verified-toggle" className="text-sm font-medium">
            Show only verified servers
          </Label>
          <button
            id="verified-toggle"
            type="button"
            role="switch"
            aria-checked={verifiedOnly}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              verifiedOnly ? 'bg-green-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                verifiedOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
