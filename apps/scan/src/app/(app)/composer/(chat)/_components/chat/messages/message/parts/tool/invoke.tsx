import { ResourceFetch } from "@/app/(app)/composer/(chat)/_components/resource-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supportedChainSchema } from "@/lib/schemas";
import { usdc } from "@/lib/tokens/usdc";

import type { RouterOutputs } from "@/trpc/client";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { parseUnits } from "viem";

interface Props {
  isResourceLoading: boolean;
  resource: RouterOutputs["public"]["resources"]["get"] | undefined;
  input: unknown;
  chatId: string;
  addToolOutput: UseChatHelpers<UIMessage>["addToolOutput"];
  toolCallId: string;
}

export const ToolInvoke: React.FC<Props> = ({
  isResourceLoading,
  resource,
  input,
  chatId,
  toolCallId,
  addToolOutput,
}) => {
  if (isResourceLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!resource) {
    return <p>Unknown resource</p>;
  }

  const accepts = resource.accepts.flatMap((accept) => {
    const network = supportedChainSchema.safeParse(accept.network);
    return network.success ? [{ ...accept, network: network.data }] : [];
  });

  return (
    <div className={"flex flex-col gap-2"}>
      <ResourceFetch
        chains={accepts.map((accept) => accept.network)}
        allRequiredFieldsFilled={true}
        maxAmountRequired={bigIntMax(
          ...accepts.map((accept) =>
            parseUnits(
              accept.maxAmountRequired.toString(),
              usdc(accept.network).decimals
            )
          )
        )}
        targetUrl={new URL(
          "/api/chat/execute-tool",
          window.location.origin
        ).toString()}
        requestInit={(chain) => ({
          body: JSON.stringify({
            resourceId: resource.id,
            chatId,
            toolCallId,
            parameters: input,
            chain,
          }),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })}
        options={{
          onSuccess: (data) => {
            void addToolOutput({
              state: "output-available",
              toolCallId,
              output: data.data,
              tool: resource.id,
            });
          },
          onError: (error) => {
            void addToolOutput({
              state: "output-error",
              toolCallId,
              errorText: error.message,
              tool: resource.id,
            });
          },
        }}
        isTool={true}
        text="Execute Tool"
      />
      <Button
        className="w-full"
        variant="ghost"
        size="sm"
        onClick={() => {
          void addToolOutput({
            state: "output-error",
            toolCallId,
            errorText: "I do not want to use this tool",
            tool: resource.id,
          });
        }}
      >
        Cancel
      </Button>
    </div>
  );
};

const bigIntMax = (...args: bigint[]) =>
  args.reduce((maximum, value) => (value > maximum ? value : maximum), 0n);
