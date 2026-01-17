'use client';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

const command = "npx @x402scan/mcp install";

export const CopyButton: React.FC = () => {
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success("Run the command to install the MCP server");
  });

  return (
    <Button
      onClick={() => void copyToClipboard(command)}
    >
      Get Started
    </Button>
  );
};
