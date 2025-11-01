import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { api } from '@/trpc/client';

import type { ToolUIPart } from 'ai';
import { resourceComponents } from './resources';

interface Props {
  part: ToolUIPart;
}
export const ToolPart: React.FC<Props> = ({ part }) => {
  const resourceId = part.type.slice(5);
  const { data: resource, isLoading: isResourceLoading } =
    api.public.resources.get.useQuery(resourceId, {
      enabled: part.state !== 'input-streaming',
    });

  if (part.state === 'input-streaming' || isResourceLoading) {
    return (
      <Tool defaultOpen={false}>
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
    <Tool>
      <ToolHeader
        state={part.state}
        isResourceLoading={isResourceLoading}
        resource={resource}
      />
      <ToolContent>
        {components ? (
          <div className="flex flex-col gap-4 px-4">
            <components.input input={part.input} />
            <components.output
              output={part.output}
              errorText={part.errorText}
            />
          </div>
        ) : (
          <>
            <ToolInput input={part.input} />
            <ToolOutput
              output={JSON.stringify(part.output)}
              errorText={part.errorText}
            />
          </>
        )}
      </ToolContent>
    </Tool>
  );
};
