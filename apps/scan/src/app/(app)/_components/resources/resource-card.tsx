'use client';

import { AlertTriangle, Copy, Check, Shield } from 'lucide-react';

import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Header } from './header/index';

import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { toast } from 'sonner';

import type { Methods } from '@/types/x402';
import type { ParsedX402Response } from '@/lib/x402';
import type { Resources, Tag } from '@x402scan/scan-db';

interface Props {
  resource: Resources;
  tags: Tag[];
  response: ParsedX402Response;
  bazaarMethod: Methods;
  className?: string;
  hideOrigin?: boolean;
  isFlat?: boolean;
  warnings?: string[];
  ownershipVerified?: boolean;
}

export const ResourceCard: React.FC<Props> = ({
  resource,
  tags,
  response,
  bazaarMethod,
  className,
  hideOrigin = false,
  isFlat = false,
  warnings = [],
  ownershipVerified = false,
}) => {
  const prompt = `Use agentcash.dev to test out this resource's endpoint: ${resource.resource}`;
  const { isCopied, copyToClipboard } = useCopyToClipboard(() => {
    toast.success('Prompt copied to clipboard');
  });

  return (
    <div className={cn('pt-4 relative', !isFlat && 'pl-4 border-l')}>
      {!isFlat && (
        <div className="absolute left-0 top-[calc(2rem+5px)] w-4 h-px bg-border" />
      )}
      <Card className={cn(className, 'overflow-hidden')}>
        <CardHeader className="bg-muted w-full flex flex-row items-center justify-between space-y-0 px-4 py-2 gap-4">
          <Header
            resource={resource}
            tags={tags}
            method={bazaarMethod}
            response={response}
            hideOrigin={hideOrigin}
          />
          <div className="flex items-center gap-2">
            {ownershipVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Shield className="size-4 text-green-600" />
                </TooltipTrigger>
                <TooltipContent side="left">
                  <div className="text-xs">Ownership verified</div>
                </TooltipContent>
              </Tooltip>
            )}
            {warnings.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="size-4 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-md">
                  <div className="text-xs space-y-1">
                    {warnings.map((warning, i) => (
                      <div key={i} className="text-muted-foreground break-all">
                        {warning}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 size-fit md:size-fit p-2"
                  onClick={() => void copyToClipboard(prompt)}
                >
                  {isCopied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <div className="text-xs">Copy prompt</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export const LoadingResourceCard = () => {
  return (
    <Card className="overflow-hidden flex w-full hover:border-primary transition-colors cursor-pointer items-stretch">
      <div className="flex-1">
        <CardHeader className="bg-muted w-full flex flex-row items-center justify-between space-y-0 p-0 hover:border-primary transition-colors px-4 py-2 gap-4">
          <div className="flex-1 flex flex-col gap-2 w-0">
            <div className="flex md:items-center justify-between flex-col md:flex-row gap-4 md:gap-0 flex-1">
              <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                <Skeleton className="w-8 h-4" />
                <Skeleton className="w-36 h-[16px] md:h-[18px]" />
              </div>
            </div>
            <Skeleton className="w-full h-[12px] md:h-[14px]" />
          </div>
        </CardHeader>
      </div>
    </Card>
  );
};
