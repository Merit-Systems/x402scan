'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { cn } from '@/lib/utils';

import { getTask } from '../_data';
import { taskIcons } from '../_data/tasks';

interface ContinueCardProps {
  task: string;
  completedLessons: string[];
}

export function ContinueCard({
  task: taskKey,
  completedLessons,
}: ContinueCardProps) {
  const task = getTask(taskKey);
  if (!task) return null;

  const Icon = taskIcons[task.id];
  const completedCount = completedLessons.filter(id =>
    task.lessons.some(l => l.id === id)
  ).length;
  const totalLessons = task.lessons.length;
  const progressPercent =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <Link href={`/mcp/guide/${taskKey}` as Route}>
      <Card className="cursor-pointer hover:border-primary/50 transition-all group bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'size-12 rounded-full flex items-center justify-center bg-primary/10',
                task.color
              )}
            >
              <Icon className="size-6" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <CardTitle className="text-base">
                  Continue your journey
                </CardTitle>
                <CardDescription>
                  {task.name} &middot; {completedCount} of {totalLessons}{' '}
                  lessons
                </CardDescription>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>

            <ArrowRight className="size-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
