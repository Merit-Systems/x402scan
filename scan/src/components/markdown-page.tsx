import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { MarkdownContent } from './markdown-content';

interface MarkdownPageProps {
  filename: string;
}

export async function MarkdownPage({ filename }: MarkdownPageProps) {
  try {
    const filePath = join(process.cwd(), 'public', filename);
    const content = await readFile(filePath, 'utf-8');

    return <MarkdownContent content={content} />;
  } catch (error) {
    console.error(`Failed to load markdown file: ${filename}`, error);
    notFound();
  }
}
