import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';

import { resourceComponents } from './resources';
import { ToolInvoke } from './invoke';

import { api } from '@/trpc/client';

import type { ToolUIPart, UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';

interface Props {
  part: ToolUIPart;
  chatId: string;
  addToolResult: UseChatHelpers<UIMessage>['addToolResult'];
}
export const ToolPart: React.FC<Props> = ({ part, chatId, addToolResult }) => {
  const resourceId = part.type.slice(5);
  const { data: resource, isLoading: isResourceLoading } =
    api.public.resources.get.useQuery(resourceId, {
      enabled: part.state !== 'input-streaming',
    });

  if (part.state === 'input-streaming' || isResourceLoading) {
    return (
      <Tool defaultOpen={false} key="streaming">
        <ToolHeader
          state={part.state}
          isResourceLoading={true}
          resource={undefined}
        />
      </Tool>
    );
  }

  const components = resource
    ? resourceComponents[resource.resource]
    : undefined;

  return (
    <Tool
      defaultOpen={part.state === 'input-available' ? true : undefined}
      key={'available'}
    >
      <ToolHeader
        state={part.state}
        isResourceLoading={isResourceLoading}
        resource={resource}
      />
      <ToolContent className="flex flex-col gap-2 px-4">
        {components ? (
          <components.input input={part.input} />
        ) : (
          <ToolInput input={part.input} />
        )}
        {part.state === 'output-error' ? (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-md text-xs [&_table]:w-full font-mono bg-destructive/10 text-destructive">
              <div className="p-3">{part.errorText}</div>
            </div>
          </div>
        ) : part.state === 'output-available' ? (
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
            addToolResult={addToolResult}
          />
        )}
      </ToolContent>
    </Tool>
  );
};
