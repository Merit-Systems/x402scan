import { notFound } from 'next/navigation';

import { Body } from '@/app/_components/layout/page-utils';

import { getLesson, getTask } from '../../_data';
import { getGuideProgressServer } from '../../_lib/cookies/server';
import { LessonDetail } from './_components/lesson-detail';

type Params = Promise<{ task: string; lesson: string }>;

export default async function LessonPage({ params }: { params: Params }) {
  const { task: taskKey, lesson: lessonId } = await params;

  const task = getTask(taskKey);
  if (!task) notFound();

  const lesson = getLesson(taskKey, lessonId);
  if (!lesson) notFound();

  const progress = await getGuideProgressServer();
  const isCompleted = progress.completedLessons.includes(lessonId);

  return (
    <Body>
      <LessonDetail
        lesson={lesson}
        taskKey={taskKey}
        isCompleted={isCompleted}
        completedLessons={progress.completedLessons}
      />
    </Body>
  );
}
