import { cookies } from 'next/headers';

import { GUIDE_COOKIE_KEYS } from './keys';
import { taskSchema } from '../schemas';

export async function getGuideProgressServer() {
  const cookieStore = await cookies();

  // Parse task
  const taskRaw = cookieStore.get(GUIDE_COOKIE_KEYS.SELECTED_TASK)?.value;
  const taskParsed = taskSchema.safeParse(taskRaw);
  const selectedTask = taskParsed.success ? taskParsed.data : null;

  // Parse completed lessons
  const completedRaw = cookieStore.get(
    GUIDE_COOKIE_KEYS.COMPLETED_LESSONS
  )?.value;
  let completedLessons: string[] = [];
  if (completedRaw) {
    try {
      completedLessons = JSON.parse(completedRaw) as string[];
    } catch {
      completedLessons = [];
    }
  }

  // Parse dismissed quick start
  const dismissedQS =
    cookieStore.get(GUIDE_COOKIE_KEYS.DISMISSED_QUICK_START)?.value === 'true';

  return {
    selectedTask,
    completedLessons,
    dismissedQuickStart: dismissedQS,
  };
}
