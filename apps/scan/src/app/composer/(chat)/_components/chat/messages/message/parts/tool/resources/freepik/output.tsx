import type { OutputComponent } from '../types';

import z from 'zod';
import { api } from '@/trpc/client';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { JsonArray } from '@/components/ai-elements/json-viewer';
import { JsonViewer } from '@/components/ai-elements/json-viewer';

const freepikOutputSchema = z.object({
  data: z.object({
    task_id: z.string(),
    status: z.string(),
  }),
});

export const FreepikOutput: OutputComponent = ({ output, errorText }) => {
  if (errorText) {
    return <div className="text-destructive text-sm">{errorText}</div>;
  }

  const parseResult = freepikOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return (
      <JsonViewer
        data={
          parseResult.error.issues.map(issue => ({
            path: issue.path,
            message: issue.message,
          })) as JsonArray
        }
      />
    );
  }

  const { task_id } = parseResult.data.data;

  return <FreepikImageDisplay task_id={task_id} />;
};

const FreepikImageDisplay: React.FC<{ task_id: string }> = ({ task_id }) => {
  const [isTaskFetched, setIsTaskFetched] = useState(false);

  const {
    data: task,
    isLoading: isTaskLoading,
    error: taskError,
  } = api.user.tools.freepik.getTask.useQuery(
    { task_id },
    {
      refetchInterval: isTaskFetched ? undefined : 2000,
    }
  );

  useEffect(() => {
    if (task?.data.status === 'COMPLETED') {
      setIsTaskFetched(true);
    }
  }, [task, task_id]);

  if (taskError) {
    return <div className="text-destructive text-sm">{taskError.message}</div>;
  }

  if (isTaskLoading || task?.data.status === 'IN_PROGRESS') {
    return <Skeleton className="size-48" />;
  }

  return (
    <div className="max-h-48">
      {task?.data.generated.map(image => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image}
          src={image}
          alt="Freepik image"
          className="max-h-48 w-auto rounded-md"
        />
      ))}
    </div>
  );
};
