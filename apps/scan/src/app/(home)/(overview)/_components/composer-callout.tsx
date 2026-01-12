import { Button } from '@/components/ui/button';
import { Network } from 'lucide-react';
import Link from 'next/link';

export const ComposerCallout = () => {
  return (
    <Link
      href="/composer"
      className="border border-primary bg-primary/5 p-4 rounded-md flex flex-col md:flex-row items-center gap-2 justify-between"
    >
      <div className="flex items-center gap-4">
        <Network className="size-8 text-primary" />
        <div className="flex flex-col">
          <h2 className="font-mono text-base md:text-lg font-bold text-primary">
            Introducing The Composer
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            A playground for building agents that use x402 resources.
          </p>
        </div>
      </div>
      <Button variant="turbo" className="shrink-0 w-full md:w-fit px-4">
        Try Now
      </Button>
    </Link>
  );
};
