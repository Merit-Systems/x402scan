import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

import type { Difficulty } from '../_types';

const difficultyConfig: Record<
  Difficulty,
  { label: string; className: string }
> = {
  beginner: {
    label: 'Beginner',
    className: 'bg-green-500/20 text-green-500 border-green-500/30',
  },
  intermediate: {
    label: 'Intermediate',
    className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  },
  advanced: {
    label: 'Advanced',
    className: 'bg-red-500/20 text-red-500 border-red-500/30',
  },
};

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyBadge({
  difficulty,
  className,
}: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
