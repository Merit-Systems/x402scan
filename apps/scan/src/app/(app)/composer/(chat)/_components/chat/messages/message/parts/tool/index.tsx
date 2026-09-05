import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

import { resourceComponents } from "./resources";
import { ToolInvoke } from "./invoke";

import { api } from "@/trpc/client";

import { getToolName } from "ai";

import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";

interface Props {
  part: ToolUIPart | DynamicToolUIPart;
  chatId: string;
  addToolOutput: UseChatHelpers<UIMessage>["addToolOutput"];
}
export const ToolPart: React.FC<Props> = ({ part, chatId, addToolOutput }) => {
  const resourceId = getToolName(part);
  const { data: resource, isLoading: isResourceLoading } =
    api.public.resources.get.useQuery(resourceId, {
      enabled: part.state !== "input-streaming",
    });

  if (part.state === "input-streaming" || isResourceLoading) {
    return (
      <Tool defaultOpen={false} key="streaming">
        <ToolHeader status={part.state} title={resourceId} />
      </Tool>
    );
  }

  const components = resource
    ? resourceComponents[resource.resource]
    : undefined;

  return (
    <Tool
      defaultOpen={part.state === "input-available" ? true : undefined}
      key={"available"}
    >
      <ToolHeader
        status={part.state}
        title={resource?.resource ?? resourceId}
      />
      <ToolContent className="flex flex-col gap-2 px-4">
        {components ? (
          <components.input input={part.input} />
        ) : (
          <ToolInput input={part.input} />
        )}
        {part.state === "output-error" ? (
          <div className="flex flex-col gap-4">
            <div className="type-mono type-scale-caption overflow-x-auto rounded-md bg-destructive/10 text-destructive [&_table]:w-full">
              <div className="p-3">{part.errorText}</div>
            </div>
          </div>
        ) : part.state === "output-available" ? (
          components ? (
            <components.output
              output={part.output}
              errorText={part.errorText}
            />
          ) : (
            <ToolOutput output={JSON.stringify(part.output)} />
          )
        ) : (
          <ToolInvoke
            isResourceLoading={isResourceLoading}
            resource={resource}
            input={part.input}
            chatId={chatId}
            toolCallId={part.toolCallId}
            addToolOutput={addToolOutput}
          />
        )}
      </ToolContent>
    </Tool>
  );
};
