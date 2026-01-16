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
import { Button } from '@/components/ui/button';
import { CheckCircle, Smartphone } from 'lucide-react';

const MOTION_PERMISSION_KEY = 'motion-permission-requested';

export const VerifiedFilterWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <VerifiedFilterProvider>
      <MotionPermissionPrompt />
      <VerifiedFilterDialog />
      {children}
    </VerifiedFilterProvider>
  );
};

// Prompt for motion permission on iOS
const MotionPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if permission was already requested
    const requested = localStorage.getItem(MOTION_PERMISSION_KEY);
    if (requested) return;

    // Check if device supports motion events and requires permission
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 2000);
    } else {
      // No permission needed, mark as completed
      localStorage.setItem(MOTION_PERMISSION_KEY, 'true');
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      const permission = await (DeviceMotionEvent as any).requestPermission();
      localStorage.setItem(MOTION_PERMISSION_KEY, 'true');
      setShowPrompt(false);
    } catch (error) {
      console.error('Error requesting motion permission:', error);
      localStorage.setItem(MOTION_PERMISSION_KEY, 'true'); // Don't show again
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(MOTION_PERMISSION_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={handleDismiss}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="size-4" />
            Enable Shake Gesture
          </DialogTitle>
          <DialogDescription>
            Allow motion access to use shake gesture for opening the verified
            filter. This is an optional feature for mobile devices.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleDismiss}>
            Skip
          </Button>
          <Button onClick={handleRequestPermission}>Enable</Button>
        </div>
      </DialogContent>
    </Dialog>
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

// Dialog with keyboard shortcut (desktop) and shake detection (mobile)
const VerifiedFilterDialog = () => {
  const [showModal, setShowModal] = useState(false);

  // Keyboard shortcut for desktop (triple tap 'v')
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

  // Shake detection for mobile
  useEffect(() => {
    // Only set up if permission was granted
    const permissionGranted = localStorage.getItem(MOTION_PERMISSION_KEY);
    if (!permissionGranted) return;

    // Use shake.js library
    const Shake = require('shake.js');
    const myShakeEvent = new Shake({
      threshold: 15, // Sensitivity of shake detection
      timeout: 1000, // Time between shakes
    });

    myShakeEvent.start();

    const handleShake = () => {
      setShowModal(true);
    };

    window.addEventListener('shake', handleShake, false);

    return () => {
      window.removeEventListener('shake', handleShake, false);
      myShakeEvent.stop();
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
