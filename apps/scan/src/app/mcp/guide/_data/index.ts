import { tasks, taskIcons } from './tasks';

import type { TaskData, TaskKey, Lesson } from '../_types';

// Re-export tasks data
export { tasks, taskIcons };

// Helper functions
export function getTask(key: string): TaskData | undefined {
  return tasks[key as TaskKey];
}

export function getLesson(
  taskKey: string,
  lessonId: string
): Lesson | undefined {
  const task = getTask(taskKey);
  if (!task) return undefined;
  return task.lessons.find(l => l.id === lessonId);
}
