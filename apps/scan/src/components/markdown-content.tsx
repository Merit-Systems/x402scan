'use client';

import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-4xl mx-auto py-8 px-4 md:px-6',
        // Customize prose styles for legal documents
        '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        // Headings
        'prose-headings:font-bold prose-headings:tracking-tight',
        'prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:mb-4',
        'prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-4',
        'prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:mb-3',
        'prose-h4:text-lg prose-h4:md:text-xl prose-h4:mt-6 prose-h4:mb-2',
        // Paragraphs and lists
        'prose-p:text-sm prose-p:md:text-base prose-p:leading-relaxed prose-p:mb-4',
        'prose-li:text-sm prose-li:md:text-base prose-li:leading-relaxed',
        'prose-ul:my-4 prose-ol:my-4',
        // Links
        'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:no-underline',
        // Strong text
        'prose-strong:font-semibold',
        // Tables
        'prose-table:text-sm prose-table:md:text-base',
        'prose-th:text-left prose-th:font-semibold',
        // Horizontal rules
        'prose-hr:my-8 prose-hr:border-gray-300 dark:prose-hr:border-gray-700',
        // Code
        'prose-code:text-sm prose-code:px-1 prose-code:py-0.5',
        'prose-code:bg-gray-100 dark:prose-code:bg-gray-800',
        'prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        className
      )}
    >
      <Streamdown>{content}</Streamdown>
    </div>
  );
}
