'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { type LucideIcon } from 'lucide-react';
import { type Clients, clients } from '@/app/mcp/_components/clients/data';
import { ClientIcon } from '@/app/mcp/_components/clients/icons';

interface Tool {
  name: string;
  icon: LucideIcon;
}

interface ExamplePromptProps {
  title: string;
  description: string;
  prompt: string;
  icon?: LucideIcon;
  tools?: Tool[];
  recommendedClient?: Clients;
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

export function ExamplePrompt({
  title,
  description,
  prompt,
  icon: Icon,
  tools,
  recommendedClient,
}: ExamplePromptProps) {
  const templateVars = useMemo(() => parseTemplateVariables(prompt), [prompt]);

  // Initialize values state based on template variables
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    parseTemplateVariables(prompt).forEach(v => {
      initial[v.raw] = '';
    });
    return initial;
  });

  // Plain text version for copying
  const filledPrompt = useMemo(() => {
    let result = prompt;
    templateVars.forEach(v => {
      // Replace with value if filled, otherwise show just the label in template syntax
      const replacement = values[v.raw] ?? `{{${v.label}}}`;
      result = result.replaceAll(v.raw, replacement);
    });
    return result;
  }, [prompt, templateVars, values]);

  // Rendered version with styled template values
  const renderedPrompt = useMemo(() => {
    if (templateVars.length === 0) return prompt;

    const rawVars = templateVars.map(v => v.raw);

    // Build a regex that matches any of the template variables
    const pattern = new RegExp(
      `(${rawVars.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'g'
    );

    const parts = prompt.split(pattern);
    const result: ReactNode[] = [];

    parts.forEach((part, i) => {
      const templateVar = templateVars.find(v => v.raw === part);
      if (templateVar) {
        // Show filled value in blue, or show just the label in template syntax if empty
        const value = values[part];
        result.push(
          <span key={i} className="text-primary font-semibold">
            {value ?? `{{${templateVar.label}}}`}
          </span>
        );
      } else {
        result.push(part);
      }
    });

    return result;
  }, [prompt, templateVars, values]);

  const hasTemplateVars = templateVars.length > 0;

  return (
    <div className="flex flex-col gap-4 border rounded-lg p-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-5 text-primary" />}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

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
                value={values[v.raw]}
                onChange={e =>
                  setValues(prev => ({ ...prev, [v.raw]: e.target.value }))
                }
                placeholder={v.example}
              />
            </div>
          ))}
        </div>
      )}

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

      <div className="flex flex-wrap items-center gap-4">
        {tools && tools.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tools:</span>
            <div className="flex items-center gap-1.5">
              {tools.map(tool => (
                <div
                  key={tool.name}
                  className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md"
                  title={tool.name}
                >
                  <tool.icon className="size-3.5" />
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendedClient && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Best with:</span>
            <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
              <ClientIcon
                client={recommendedClient}
                className="size-3.5 fill-current"
              />
              <span>{clients[recommendedClient].name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
