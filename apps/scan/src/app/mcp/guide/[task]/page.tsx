import { notFound } from 'next/navigation';

import { Body } from '@/app/_components/layout/page-utils';

import { getTask } from '../_data';
import { getGuideProgressServer } from '../_lib/cookies/server';
import { LessonCard } from './_components/lesson-card';

type Params = Promise<{ task: string }>;

export default async function TaskLessonsPage({ params }: { params: Params }) {
  const { task: taskKey } = await params;
  const task = getTask(taskKey);
  if (!task) notFound();

  const progress = await getGuideProgressServer();
  const firstIncompleteLessonIndex = task.lessons.findIndex(
    l => !progress.completedLessons.includes(l.id)
  );

  return (
    <Body>
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
    </Body>
  );
}
