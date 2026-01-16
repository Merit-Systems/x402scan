'use client';

import { useEffect, useState } from 'react';
import { VerifiedFilterProvider } from '@/app/_contexts/verified-filter/provider';
import { useVerifiedFilter } from '@/app/_contexts/verified-filter/hook';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

export const VerifiedFilterWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <VerifiedFilterProvider>
      <VerifiedFilterDialog />
      {children}
    </VerifiedFilterProvider>
  );
};

// Reusable toggle switch component
const VerifiedToggleSwitch = () => {
  const { verifiedOnly, setVerifiedOnly } = useVerifiedFilter();

  const handleToggle = () => {
    setVerifiedOnly(!verifiedOnly);
  };

  return (
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
  );
};

// Dialog with keyboard shortcut (triple tap 'v') and logo click (5 times)
const VerifiedFilterDialog = () => {
  const [showModal, setShowModal] = useState(false);

  // Keyboard shortcut (triple tap 'v')
  useEffect(() => {
    let tapCount = 0;
    let tapTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        tapCount++;

        // Clear existing timeout
        if (tapTimeout) {
          clearTimeout(tapTimeout);
        }

        // Open modal on third tap
        if (tapCount === 3) {
          e.preventDefault();
          setShowModal(true);
          tapCount = 0;
        } else {
          // Reset counter after 500ms of no taps
          tapTimeout = setTimeout(() => {
            tapCount = 0;
          }, 500);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
    };
  }, []);

  // Listen for custom event from logo clicks
  useEffect(() => {
    const handleOpenModal = () => {
      setShowModal(true);
    };

    window.addEventListener('open-verified-filter-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-verified-filter-modal', handleOpenModal);
    };
  }, []);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
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
        <VerifiedToggleSwitch />
      </DialogContent>
    </Dialog>
  );
};
