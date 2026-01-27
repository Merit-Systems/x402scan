import { notFound } from 'next/navigation';

import { getTask } from '../_data';
import { getGuideProgressServer } from '../_lib/cookies/server';
import { ProgressHeader } from './_components/progress-header';

type Params = Promise<{ task: string }>;

export default async function TaskLayout({
  params,
  children,
}: {
  params: Params;
  children: React.ReactNode;
}) {
  const { task: taskKey } = await params;
  const task = getTask(taskKey);
  if (!task) notFound();

  const progress = await getGuideProgressServer();
  const completedCount = progress.completedLessons.filter(id =>
    task.lessons.some(l => l.id === id)
  ).length;

  return (
    <>
      <ProgressHeader
        task={task}
        completedCount={completedCount}
        totalLessons={task.lessons.length}
      />
      {children}
    </>
  );
}
