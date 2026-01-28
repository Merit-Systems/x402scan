import { notFound } from 'next/navigation';

import { getGuide } from '../../_lib/mdx';
import { isValidPagePath, collectPagePaths } from '../../_lib/navigation';

const GUIDE_SLUG = 'knowledge-work';

export default async function Page({
  params,
}: PageProps<'/mcp/guide/knowledge-work/[...path]'>) {
  const { path } = await params;

  const guide = getGuide(GUIDE_SLUG);

  if (!isValidPagePath(guide.items, path)) {
    notFound();
  }

  const mdxPath = path.join('/');
  const { default: Content } = (await import(
    `@/app/mcp/guide/${GUIDE_SLUG}/_content/${mdxPath}.mdx`
  )) as { default: React.ComponentType };

  return (
    <div className="flex flex-col gap-4">
      <Content />
    </div>
  );
}

export function generateStaticParams() {
  const guide = getGuide(GUIDE_SLUG);
  const paths = collectPagePaths(guide.items);

  return paths.map(path => ({ path }));
}

export const dynamicParams = false;
