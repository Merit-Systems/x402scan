import { ToolOutput } from "@/components/ai-elements/tool";
import type { OutputComponent } from "../../types";

import z from "zod";
import { api } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

const createSoraVideoOutputSchema = z.object({
  id: z.string(),
  object: z.literal("video"),
  created_at: z.number().int(),
  status: z.string(),
  completed_at: z.number().int().nullable(),
  error: z.record(z.string(), z.any()).nullable(),
  expires_at: z.number().int().nullable(),
  model: z.string(),
  progress: z.number().int(),
  remixed_from_video_id: z.string().nullable(),
  seconds: z.string(),
  size: z.string(),
});

export const SoraOutput: OutputComponent = ({ output, errorText }) => {
  if (errorText) {
    return (
      <div className="type-supporting-body text-destructive">{errorText}</div>
    );
  }

  const parseResult = createSoraVideoOutputSchema.safeParse(output);

  if (!parseResult.success) {
    const encodedOutput = z.string().safeParse(output);
    if (!encodedOutput.success) {
      return (
        <div className="type-supporting-body text-destructive">
          Invalid output
        </div>
      );
    }
    let data: unknown;
    try {
      data = JSON.parse(encodedOutput.data);
    } catch {
      return (
        <div className="type-supporting-body text-destructive">
          Invalid output
        </div>
      );
    }
    const json = z.json().safeParse(data);
    return json.success ? (
      <ToolOutput output={json.data} />
    ) : (
      <div className="type-supporting-body text-destructive">
        Invalid output
      </div>
    );
  }

  const { id } = parseResult.data;

  return <SoraVideoDisplay id={id} />;
};

const SoraVideoDisplay: React.FC<{ id: string }> = ({ id }) => {
  const {
    data: task,
    isLoading: isTaskLoading,
    error: taskError,
  } = api.user.tools.echo.sora.getVideo.useQuery(id, {
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status &&
        ["completed", "failed", "cancelled", "expired"].includes(status)
        ? false
        : 2000;
    },
  });

  if (taskError) {
    return (
      <div className="type-supporting-body text-destructive">
        {taskError.message}
      </div>
    );
  }

  if (isTaskLoading || !task) {
    return <Skeleton className="h-48 w-72" />;
  }

  if (task.status !== "completed") {
    return (
      <div className="type-supporting-body text-destructive">
        Failed to generate video
      </div>
    );
  }

  return (
    <div className="max-h-48 w-auto">
      <video
        src={`https://echo.router.merit.systems/v1/videos/${id}/content`}
        controls
        className="max-h-48 w-auto rounded-md"
      >
        <track
          kind="captions"
          src="data:text/vtt;charset=utf-8,WEBVTT%0A%0A"
          srcLang="en"
          label="Captions unavailable"
        />
      </video>
    </div>
  );
};
