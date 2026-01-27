'use client';

import Link from 'next/link';

import { ArrowLeft, RotateCcw } from 'lucide-react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { cn } from '@/lib/utils';

import { guideClientCookies } from '../../_lib/cookies/client';

import { taskIcons } from '../../_data/tasks';

import type { TaskData } from '../../_types';

interface ProgressHeaderProps {
  task: TaskData;
  completedCount: number;
  totalLessons: number;
}

export function ProgressHeader({
  task,
  completedCount,
  totalLessons,
}: ProgressHeaderProps) {
  const router = useRouter();
  const Icon = taskIcons[task.id];
  const progressPercent =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const handleReset = () => {
    guideClientCookies.reset();
    router.push('/mcp/guide');
    router.refresh();
  };

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8 pb-4">
      {/* Task info and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'size-12 rounded-full flex items-center justify-center bg-muted',
              task.color
            )}
          >
            <Icon className="size-6" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{task.name}</h2>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/mcp/guide">
              <ArrowLeft className="size-4 mr-1" />
              Change Task
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground"
          >
            <RotateCcw className="size-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedCount} of {totalLessons} lessons completed
          </span>
          <span className="font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
}
