import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { getGuide } from '../../_lib/mdx';
import { collectPagePaths, findPageLocation } from '../../_lib/navigation';

import type { Route } from 'next';

const GUIDE_SLUG = 'knowledge-work';

export default async function Page({
  params,
}: PageProps<'/mcp/guide/knowledge-work/[...path]'>) {
  const { path } = await params;

  const guide = await getGuide(GUIDE_SLUG);

  const pageLocation = findPageLocation(guide.items, path);

  if (!pageLocation) {
    notFound();
  }

  const pageSectionIndex = pageLocation.section?.items.findIndex(
    item => item.slug === pageLocation.page.slug
  );
  console.log(pageSectionIndex);
  const nextPage =
    pageSectionIndex !== undefined
      ? pageLocation.section?.items[pageSectionIndex + 1]
      : null;

  const mdxPath = path.join('/');
  const { default: Content } = (await import(
    `@/app/mcp/guide/${GUIDE_SLUG}/_content/${mdxPath}.mdx`
  )) as { default: React.ComponentType };

  return (
    <div className="flex flex-col gap-4">
      <Content />

      {nextPage && (
        <div className="flex flex-col gap-6 border py-8 px-4 rounded-xl items-center text-center mt-16">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Next Up</p>
            <h1 className="text-2xl font-bold">{nextPage.title}</h1>
          </div>
          <p className="text-base">{nextPage.description}</p>
          <Link
            href={
              `/mcp/guide/${GUIDE_SLUG}/${pageLocation.section?.slug}/${nextPage.slug}` as Route<'mcp/guide/[section]/[page]'>
            }
          >
            <Button>
              Next <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  const guide = await getGuide(GUIDE_SLUG);
  const paths = collectPagePaths(guide.items);

  return paths.map(path => ({ path }));
}

export const dynamicParams = false;
