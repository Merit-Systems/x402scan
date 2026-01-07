import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export const V2Callout = () => {
  return (
    <Link
      href="/resources/register"
      className="border border-primary bg-primary/5 p-4 rounded-md flex flex-col md:flex-row items-center gap-2 justify-between"
    >
      <div className="flex items-center gap-4">
        <Sparkles className="size-8 text-primary" />
        <div className="flex flex-col">
          <h2 className="font-mono text-base md:text-lg font-bold text-primary">
            V2 Support
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            We now support x402 protocol version 2 resources.
          </p>
        </div>
      </div>
      <Button variant="turbo" className="shrink-0 w-full md:w-fit px-4">
        Register Resource
      </Button>
    </Link>
  );
};
