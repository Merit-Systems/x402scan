'use client';

import Link from 'next/link';

import { ArrowUp, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';

import {
  Book,
  BookBinding,
  BookContent,
  BookCover,
} from '@/app/mcp/_components/guide/book';
import { Logo } from '@/components/logo';

import type { Guides } from '../_lib/mdx';
import { useParams } from 'next/navigation';

interface Props {
  guides: Guides;
}

export const GuidesHeader: React.FC<Props> = ({ guides }) => {
  const params = useParams<{ guide: string; lesson: string }>();

  const guide = guides[params.guide];

  if (!guide) {
    return null;
  }

  const lessonIndex = guide.pages.findIndex(
    page => page.slug === params.lesson
  );

  if (lessonIndex === -1) {
    return null;
  }

  const lesson = guide.pages[lessonIndex]!;

  const totalLessons = guide.pages.length;
  const progressPercent =
    totalLessons > 0 ? Math.round((lessonIndex / totalLessons) * 100) : 0;

  return (
    <div className="flex items-center justify-between bg-card border rounded-full p-3">
      {/* Left side: List icon + Task info */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full size-8 md:size-8"
      >
        <List className="size-4" />
      </Button>

      <div className="w-px h-6 bg-border ml-2 mr-4" />

      <div className="flex items-center gap-3 justify-between flex-1">
        <div className="flex items-center gap-3">
          <Book className="h-10 w-8 rounded-sm">
            <BookBinding className="w-1.25" />
            <BookCover className="flex flex-col justify-between">
              <BookContent>
                <div className="p-1 bg-white/50 dark:bg-black/50 rounded-full [box-shadow:0_0.5_rgba(0,0,0,0.15)] dark:[box-shadow:0_0.5_rgba(255,255,255,0.15)]">
                  <Logo className="size-2.5 text-neutral-500 dark:text-neutral-400" />
                </div>
              </BookContent>
            </BookCover>
          </Book>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{lesson.metadata.title}</span>
            <span className="text-muted-foreground text-xs">{guide.title}</span>
          </div>
        </div>

        {/* Right side: Progress info + Circular progress + Up button */}
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <div className="font-medium">{progressPercent}%</div>
            <div className="text-muted-foreground text-xs">
              {lessonIndex + 1}/{totalLessons} lessons
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
        </div>
      </div>
      <div className="w-px h-6 bg-border ml-4 mr-2" />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full size-8 md:size-8"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
};
