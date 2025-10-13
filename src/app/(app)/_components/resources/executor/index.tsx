'use client';

import { Card, CardHeader } from '@/components/ui/card';

import { Header } from './header/header';
import { Form } from './form';

import { cn } from '@/lib/utils';

import { ResourceFetchProvider } from './contexts/fetch/provider';

import type { Methods } from '@/types/x402';
import type { Resources } from '@prisma/client';
import type { ParsedX402Response } from '@/lib/x402/schema';

interface Props {
  resource: Resources;
  response: ParsedX402Response;
  bazaarMethod: Methods;
  className?: string;
}

export const ResourceExecutor: React.FC<Props> = ({
  resource,
  response,
  bazaarMethod,
  className,
}) => {
  return (
    <ResourceFetchWrapper
      response={response}
      bazaarMethod={bazaarMethod}
      resource={resource.resource}
    >
      <Card className={cn(className, 'overflow-hidden')}>
        <CardHeader className="bg-muted px-4 py-2">
          <Header
            resource={resource}
            method={bazaarMethod}
            response={response}
          />
        </CardHeader>
        <Form x402Response={response} />
      </Card>
    </ResourceFetchWrapper>
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
