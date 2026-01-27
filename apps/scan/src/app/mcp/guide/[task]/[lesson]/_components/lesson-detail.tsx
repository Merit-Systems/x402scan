'use client';

import { useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

import { DifficultyBadge } from '../../../_components/difficulty-badge';

import { guideClientCookies } from '../../../_lib/cookies/client';
import type { Lesson } from '../../../_types';

interface TemplateVar {
  raw: string;
  label: string;
  example: string;
}

function parseTemplateVariables(prompt: string): TemplateVar[] {
  const matches = prompt.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  const seen = new Set<string>();
  return matches
    .filter(match => {
      if (seen.has(match)) return false;
      seen.add(match);
      return true;
    })
    .map(raw => {
      const inner = raw.slice(2, -2);
      const pipeIndex = inner.indexOf('|');
      if (pipeIndex === -1) {
        return { raw, label: inner, example: inner };
      }
      return {
        raw,
        label: inner.slice(0, pipeIndex),
        example: inner.slice(pipeIndex + 1),
      };
    });
}

interface LessonDetailProps {
  lesson: Lesson;
  taskKey: string;
  isCompleted: boolean;
  completedLessons: string[];
}

export function LessonDetail({
  lesson,
  taskKey,
  isCompleted,
  completedLessons,
}: LessonDetailProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});

  const templateVars = useMemo(
    () => parseTemplateVariables(lesson.prompt),
    [lesson.prompt]
  );

  const filledPrompt = useMemo(() => {
    let result = lesson.prompt;
    templateVars.forEach(v => {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentionally treating empty string as falsy
      const replacement = values[v.raw] || `{{${v.label}}}`;
      result = result.replaceAll(v.raw, replacement);
    });
    return result;
  }, [lesson.prompt, templateVars, values]);

  const handleComplete = () => {
    guideClientCookies.addCompletedLesson(lesson.id, completedLessons);
    router.refresh();
  };

  const handleUncomplete = () => {
    guideClientCookies.removeCompletedLesson(lesson.id, completedLessons);
    router.refresh();
  };

  const handleBack = () => {
    router.push(`/mcp/guide/${taskKey}` as Route);
  };

  const stepIndicator = isCompleted ? (
    <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
      <Check className="size-5 text-green-500" />
    </div>
  ) : (
    <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0">
      <Play className="size-4 text-primary-foreground fill-current" />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className={cn(isCompleted && 'opacity-80')}>
        <CardHeader>
          <div className="flex items-start gap-4">
            {stepIndicator}
            <div className="flex-1 min-w-0 space-y-1">
              <CardTitle className="text-xl">{lesson.title}</CardTitle>
              <p className="text-muted-foreground">{lesson.description}</p>
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

        <CardContent className="space-y-6">
          {/* Expected outcome */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              What You&apos;ll Get
            </h4>
            <p className="text-sm">{lesson.expectedOutcome}</p>
          </div>

          {/* Prompt section */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Prompt Template
            </h4>

            {/* Template variable inputs */}
            {templateVars.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {templateVars.map(v => (
                  <div
                    key={v.raw}
                    className="flex flex-col gap-1 flex-1 min-w-[180px]"
                  >
                    <label className="text-xs font-medium text-muted-foreground">
                      {v.label}
                    </label>
                    <Input
                      value={values[v.raw] ?? ''}
                      onChange={e =>
                        setValues(prev => ({
                          ...prev,
                          [v.raw]: e.target.value,
                        }))
                      }
                      placeholder={v.example}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Prompt display */}
            <div className="relative rounded-md bg-muted p-3 pr-12">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {filledPrompt}
              </pre>
              <CopyButton
                text={filledPrompt}
                toastMessage="Prompt copied to clipboard"
                className="absolute top-2 right-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Lessons
        </Button>
        <Button
          variant={isCompleted ? 'outline' : 'default'}
          onClick={isCompleted ? handleUncomplete : handleComplete}
        >
          {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
        </Button>
      </div>
    </div>
  );
}
