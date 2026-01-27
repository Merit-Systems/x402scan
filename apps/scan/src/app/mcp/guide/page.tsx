import { Body } from '@/app/_components/layout/page-utils';

import { TaskSelector } from './_components/task-selector';
import { ContinueCard } from './_components/continue-card';

import { getGuideProgressServer } from './_lib/cookies/server';

export default async function GuidePage() {
  const progress = await getGuideProgressServer();

  return (
    <Body className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-3xl font-bold">Automate Your Knowledge Work</h1>
        <p className="text-muted-foreground">
          Select a task to get started. Each task has guided lessons to help you
          accomplish your goal.
        </p>
      </div>
      {progress.selectedTask && (
        <ContinueCard
          task={progress.selectedTask}
          completedLessons={progress.completedLessons}
        />
      )}
      <TaskSelector />
    </Body>
  );
}
