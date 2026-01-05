import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { MarkdownContent } from './markdown-content';

type MarkdownPageProps = {
  filename: string;
};

export async function MarkdownPage({ filename }: MarkdownPageProps) {
  let content: string;
  try {
    const filePath = join(process.cwd(), 'public', filename);
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load markdown file: ${filename}`, error);
    notFound();
  }

  return <MarkdownContent content={content} />;
}
