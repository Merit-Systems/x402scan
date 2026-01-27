import { ArrowRight } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { cn } from '@/lib/utils';

import { selectTask } from '../_lib/actions';
import { tasks, taskIcons } from '../_data';

import type { TaskKey, TaskData, Lesson } from '../_types';

export function TaskSelector() {
  const taskEntries = Object.entries(tasks) as [TaskKey, TaskData][];

  return (
    <div className="space-y-6">
      <div className="space-y-3 max-w-2xl mx-auto">
        {taskEntries.map(([key, task]) => {
          const Icon = taskIcons[task.id];
          const beginnerCount = task.lessons.filter(
            (l: Lesson) => l.difficulty === 'beginner'
          ).length;

          return (
            <form key={key} action={selectTask}>
              <input type="hidden" name="task" value={key} />
              <button type="submit" className="w-full text-left">
                <Card className="cursor-pointer hover:border-primary/50 transition-all group">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'size-12 rounded-full flex items-center justify-center bg-muted',
                          'group-hover:bg-primary/10 transition-colors',
                          task.color
                        )}
                      >
                        <Icon className="size-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{task.name}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.lessons.length} lessons ({beginnerCount}{' '}
                          beginner)
                        </p>
                      </div>

                      <ArrowRight className="size-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </CardHeader>
                </Card>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
