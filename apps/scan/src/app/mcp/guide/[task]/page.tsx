import { notFound } from 'next/navigation';

import { getTask } from '../_data';
import { getGuideProgressServer } from '../_lib/cookies/server';
import { LessonCard } from './_components/lesson-card';

export default async function TaskLessonsPage({
  params,
}: PageProps<'/mcp/guide/[task]'>) {
  const { task: taskKey } = await params;
  const task = getTask(taskKey);
  if (!task) notFound();

  const progress = await getGuideProgressServer();
  const firstIncompleteLessonIndex = task.lessons.findIndex(
    l => !progress.completedLessons.includes(l.id)
  );

  return (
    <div className="space-y-3">
      {task.lessons.map((lesson, index) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          taskKey={taskKey}
          index={index}
          isCompleted={progress.completedLessons.includes(lesson.id)}
          isNext={index === firstIncompleteLessonIndex}
        />
      ))}
    </div>
  );
}
