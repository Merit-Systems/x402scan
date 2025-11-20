import { ResourceFetch } from '@/app/_components/resource-fetch';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { supportedChainSchema } from '@/lib/schemas';
import { usdc } from '@/lib/tokens/usdc';

import type { RouterOutputs } from '@/trpc/client';
import type { SupportedChain } from '@/types/chain';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ToolUIPart, UIMessage } from 'ai';
import { parseUnits } from 'viem';

interface Props {
  isResourceLoading: boolean;
  resource: RouterOutputs['public']['resources']['get'] | undefined;
  input: ToolUIPart['input'];
  chatId: string;
  addToolResult: UseChatHelpers<UIMessage>['addToolResult'];
  toolCallId: string;
}

export const ToolInvoke: React.FC<Props> = ({
  isResourceLoading,
  resource,
  input,
  chatId,
  toolCallId,
  addToolResult,
}) => {
  return (
    <div className={'flex flex-col gap-2'}>
      <Loading
        value={resource}
        isLoading={isResourceLoading}
        component={resource => (
          <>
            <ResourceFetch
              chains={
                resource.accepts
                  .map(accept => accept.network)
                  .filter(
                    network => supportedChainSchema.safeParse(network).success
                  ) as SupportedChain[]
              }
              allRequiredFieldsFilled={true}
              maxAmountRequired={bigIntMax(
                ...resource.accepts.map(accept =>
                  parseUnits(
                    accept.maxAmountRequired.toString(),
                    usdc(accept.network as SupportedChain).decimals
                  )
                )
              )}
              targetUrl={new URL(
                '/api/chat/execute-tool',
                window.location.origin
              ).toString()}
              requestInit={chain => ({
                body: JSON.stringify({
                  resourceId: resource.id,
                  chatId,
                  toolCallId,
                  parameters: input,
                  chain: chain.toString(),
                }),
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              })}
              options={{
                onSuccess: data => {
                  void addToolResult({
                    state: 'output-available',
                    toolCallId: toolCallId,
                    output: data.data,
                    tool: resource.id,
                  });
                },
                onError: error => {
                  void addToolResult({
                    state: 'output-error',
                    toolCallId: toolCallId,
                    errorText: error.message,
                    tool: resource.id,
                  });
                },
              }}
              isTool={true}
              text="Execute Tool"
            />
            <Button
              className="w-full text-muted-foreground"
              variant="ghost"
              size="sm"
              onClick={() => {
                void addToolResult({
                  state: 'output-error',
                  toolCallId: toolCallId,
                  errorText: 'I do not want to use this tool',
                  tool: resource.id,
                });
              }}
            >
              Cancel
            </Button>
          </>
        )}
        loadingComponent={<Skeleton className="h-10 w-full" />}
        errorComponent={<p>Unknown resource</p>}
      />
    </div>
  );
};

const bigIntMax = (...args: bigint[]) => args.reduce((m, e) => (e > m ? e : m));
