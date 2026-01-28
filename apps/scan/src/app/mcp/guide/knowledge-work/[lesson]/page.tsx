import { notFound } from 'next/navigation';
import { getGuides } from '../../../_lib/mdx';

import type { Metadata } from '../../../_lib/mdx';

export default async function Page({
  params,
}: PageProps<'/mcp/guide/knowledge-work/[lesson]'>) {
  const { lesson } = await params;

  const guides = await getGuides();

  const guideData = guides[guide];

  if (!guideData) {
    notFound();
  }

  const lessonIndex = guideData.pages.findIndex(data => data.slug === lesson);

  if (lessonIndex === -1) {
    notFound();
  }

  const lessonData = guideData.pages[lessonIndex]!;

  if (!lessonData) {
    notFound();
  }

  const { default: Page } = (await import(
    `../../_content/${guide}/${lesson}.mdx`
  )) as { default: React.ComponentType };

  return (
    <div className="flex flex-col gap-4">
      <Page />
    </div>
  );
}

export function generateStaticParams() {
  return [{ slug: 'welcome' }, { slug: 'about' }];
}

export const dynamicParams = false;
