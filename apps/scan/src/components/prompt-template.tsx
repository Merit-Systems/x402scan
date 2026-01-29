'use client';

import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';

import type { ReactNode } from 'react';
import { Button } from './ui/button';
import {
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  Dialog,
} from './ui/dialog';
import { Icon } from '@/app/mcp/guide/_components/icon';

interface Frontmatter {
  title: string;
  description: string;
  icon?: string;
}

function parseFrontmatter(content: string): {
  frontmatter: Frontmatter | null;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
  const match = frontmatterRegex.exec(content);

  if (!match) {
    return { frontmatter: null, body: content };
  }

  const [, frontmatterStr, body] = match;
  const frontmatter: Partial<Frontmatter> = {};

  frontmatterStr?.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === 'title' || key === 'description' || key === 'icon') {
      frontmatter[key] = value;
    }
  });

  if (!frontmatter.title || !frontmatter.description) {
    return { frontmatter: null, body: content };
  }

  return {
    frontmatter: frontmatter as Frontmatter,
    body: body?.trim() ?? '',
  };
}

interface TemplateVar {
  raw: string; // Full match e.g. "{{Label|example}}"
  label: string; // Short label for the input
  example: string; // Example placeholder text
}

function parseTemplateVariables(prompt: string): TemplateVar[] {
  const matches = prompt.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  // Return unique template variables (preserving order of first occurrence)
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

interface Props {
  templateString: string;
}

export const PromptTemplate: React.FC<Props> = ({ templateString }) => {
  // Parse frontmatter and body
  const { frontmatter, body } = useMemo(
    () => parseFrontmatter(templateString),
    [templateString]
  );

  const templateVars = useMemo(() => parseTemplateVariables(body), [body]);

  // Initialize values state based on template variables
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    parseTemplateVariables(body).forEach(v => {
      initial[v.raw] = '';
    });
    return initial;
  });

  // Plain text version for copying
  const filledPrompt = useMemo(() => {
    let result = body;
    templateVars.forEach(v => {
      // Replace with value if filled, otherwise show just the label in template syntax
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentionally treating empty string as falsy
      const replacement = values[v.raw] || `{{${v.label}}}`;
      result = result.replaceAll(v.raw, replacement);
    });
    return result;
  }, [body, templateVars, values]);

  // Rendered version with styled template values
  const renderedPrompt = useMemo(() => {
    if (templateVars.length === 0) return body;

    const rawVars = templateVars.map(v => v.raw);

    // Build a regex that matches any of the template variables
    const pattern = new RegExp(
      `(${rawVars.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'g'
    );

    const parts = body.split(pattern);
    const result: ReactNode[] = [];

    parts.forEach((part, i) => {
      const templateVar = templateVars.find(v => v.raw === part);
      if (templateVar) {
        // Show filled value in blue, or show just the label in template syntax if empty
        const value = values[part];
        result.push(
          <span key={i} className="text-primary font-semibold">
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentionally treating empty string as falsy */}
            {value || `{{${templateVar.label}}}`}
          </span>
        );
      } else {
        result.push(part);
      }
    });

    return result;
  }, [body, templateVars, values]);

  const hasTemplateVars = templateVars.length > 0;

  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4 bg-card">
      {frontmatter && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {frontmatter.icon && (
              <Icon icon={frontmatter.icon} className="size-5 text-primary" />
            )}
            <h3 className="text-lg font-semibold">{frontmatter.title}</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            {frontmatter.description}
          </p>
        </div>
      )}

      {hasTemplateVars && (
        <div className="flex flex-wrap gap-3">
          {templateVars.map(v => (
            <div
              key={v.raw}
              className="flex flex-col gap-1 flex-1 min-w-[200px]"
            >
              <label className="text-xs font-medium text-muted-foreground">
                {v.label}
              </label>
              <Input
                value={values[v.raw] ?? ''}
                onChange={e =>
                  setValues(prev => ({ ...prev, [v.raw]: e.target.value }))
                }
                placeholder={v.example}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button
          disabled={Object.values(values).some(value => value === '')}
          className="flex-1"
          onClick={() => void navigator.clipboard.writeText(filledPrompt)}
        >
          Copy Prompt
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="flex-1">
              See Full Prompt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Full Prompt</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              The full prompt with all the template variables filled in.
            </DialogDescription>
            <div className="relative rounded-md bg-muted p-3 pr-12">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {renderedPrompt}
              </pre>
              <CopyButton
                text={filledPrompt}
                toastMessage="Prompt copied to clipboard"
                className="absolute top-2 right-2"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
