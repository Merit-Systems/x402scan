import { ArrowRight } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Book, BookBinding, BookCover, BookContent } from './book';

import { selectTask } from '../_lib/actions';
import { tasks, taskIcons } from '../_data';

import type { TaskKey, TaskData, Lesson } from '../_types';
import { Button } from '@/components/ui/button';

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
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Book className="h-15 w-13">
                    <BookBinding />
                    <BookCover>
                      <BookContent className="px-2">
                        <div className="p-1.5 bg-white/50 dark:bg-black/50 rounded-full [box-shadow:0_1px_rgba(0,0,0,0.15)] dark:[box-shadow:0_0.5_rgba(255,255,255,0.15)]">
                          <Icon className="size-4 text-neutral-500 dark:text-neutral-400" />
                        </div>
                      </BookContent>
                    </BookCover>
                  </Book>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{task.name}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.lessons.length} lessons ({beginnerCount} beginner)
                    </p>
                  </div>

                  <form action={selectTask}>
                    <input type="hidden" name="task" value={key} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      Start
                      <ArrowRight className="size-4 transition-all shrink-0" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
