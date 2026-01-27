import type { Route } from 'next';
import Link from 'next/link';
import { Check, Play } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/magicui/border-beam';

import { cn } from '@/lib/utils';

import { DifficultyBadge } from '../../_components/difficulty-badge';

import type { Lesson } from '../../_types';

interface LessonCardProps {
  lesson: Lesson;
  taskKey: string;
  index: number;
  isCompleted: boolean;
  isNext: boolean;
}

export function LessonCard({
  lesson,
  taskKey,
  index,
  isCompleted,
  isNext,
}: LessonCardProps) {
  const stepIndicator = isCompleted ? (
    <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
      <Check className="size-4 text-green-500" />
    </div>
  ) : isNext ? (
    <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
      <Play className="size-3.5 text-primary-foreground fill-current" />
    </div>
  ) : (
    <div className="size-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center shrink-0">
      <span className="text-sm text-muted-foreground">{index + 1}</span>
    </div>
  );

  return (
    <Link href={`/mcp/guide/${taskKey}/${lesson.id}` as Route}>
      <Card
        className={cn(
          'relative overflow-hidden transition-all cursor-pointer hover:border-primary/50',
          isNext && 'border-primary',
          isCompleted && 'opacity-60'
        )}
      >
        {isNext && <BorderBeam size={120} duration={8} />}

        <CardHeader>
          <div className="flex items-start gap-4">
            {stepIndicator}

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{lesson.title}</CardTitle>
                {isNext && <Badge variant="default">Start here</Badge>}
              </div>
              <CardDescription>{lesson.description}</CardDescription>
              <div className="flex items-center gap-3 pt-1">
                <DifficultyBadge difficulty={lesson.difficulty} />
                <span className="text-xs text-muted-foreground">
                  {lesson.estimatedCost}
                </span>
                <span className="text-xs text-muted-foreground">
                  {lesson.tools.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
