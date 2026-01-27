'use client';

import Link from 'next/link';

import { ArrowUp, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';

import { cn } from '@/lib/utils';

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
  const Icon = taskIcons[task.id];
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between bg-card border rounded-full px-4 py-2 h-14">
        {/* Left side: List icon + Task info */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href="/mcp/guide">
              <List className="size-5" />
            </Link>
          </Button>

          <div className="w-px h-6 bg-border" />

          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'size-8 rounded-md flex items-center justify-center bg-muted',
                task.color
              )}
            >
              <Icon className="size-4" />
            </div>
            <span className="font-medium text-sm">{task.name}</span>
          </div>
        </div>

        {/* Right side: Progress info + Circular progress + Up button */}
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <div className="font-medium">{progressPercent}%</div>
            <div className="text-muted-foreground text-xs">
              {completedCount}/{totalLessons} lessons
            </div>
          </div>

          <AnimatedCircularProgressBar
            value={progressPercent}
            max={100}
            min={0}
            gaugePrimaryColor="var(--primary)"
            gaugeSecondaryColor="var(--muted)"
            className="size-8 text-xs"
            hideText
          />

          <div className="w-px h-6 bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
