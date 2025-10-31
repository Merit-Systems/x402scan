'use client';

import { ChevronDownIcon } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { Header } from './header/header';
import { Form } from './form';

import { cn } from '@/lib/utils';

import { ResourceFetchProvider } from './contexts/fetch/provider';

import type { Methods } from '@/types/x402';
import type { ParsedX402Response } from '@/lib/x402/schema';
import type { Resources, Tag } from '@prisma/client';

interface Props {
  resource: Resources;
  tags: Tag[];
  response: ParsedX402Response;
  bazaarMethod: Methods;
  className?: string;
  hideOrigin?: boolean;
  defaultOpen?: boolean;
  isFlat?: boolean;
}

export const ResourceExecutor: React.FC<Props> = ({
  resource,
  tags,
  response,
  bazaarMethod,
  className,
  hideOrigin = false,
  isFlat = false,
}) => {
  return (
    <ResourceFetchWrapper
      response={response}
      bazaarMethod={bazaarMethod}
      resource={resource.resource}
    >
      <AccordionItem
        value={resource.id}
        key={resource.id}
        className={cn('border-b-0 pt-4 relative', !isFlat && 'pl-4 border-l')}
      >
        {!isFlat && (
          <div className="absolute left-0 top-[calc(2rem+5px)] w-4 h-[1px] bg-border" />
        )}
        <Card className={cn(className, 'overflow-hidden')}>
          <AccordionTrigger asChild>
            <CardHeader className="bg-muted w-full flex flex-row items-center justify-between space-y-0 p-0 hover:border-primary transition-colors px-4 py-2 gap-4">
              <Header
                resource={resource}
                tags={tags}
                method={bazaarMethod}
                response={response}
                hideOrigin={hideOrigin}
              />
              <ChevronDownIcon className="size-4" />
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <Form x402Response={response} />
          </AccordionContent>
        </Card>
      </AccordionItem>
    </ResourceFetchWrapper>
  );
};

export const LoadingResourceExecutor = () => {
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

function ResourceFetchWrapper({
  children,
  response,
  bazaarMethod,
  resource,
}: {
  children: React.ReactNode;
  response: ParsedX402Response;
  bazaarMethod: Methods;
  resource: string;
}) {
  if (!response) return children;

  const accept = response?.accepts?.[0];

  if (!accept) return null;

  const inputSchema = accept.outputSchema?.input;

  if (!inputSchema) return null;

  const maxAmountRequired = BigInt(accept.maxAmountRequired);

  return (
    <ResourceFetchProvider
      inputSchema={inputSchema}
      maxAmountRequired={maxAmountRequired}
      method={bazaarMethod}
      resource={resource}
      x402Response={response}
    >
      {children}
    </ResourceFetchProvider>
  );
}
