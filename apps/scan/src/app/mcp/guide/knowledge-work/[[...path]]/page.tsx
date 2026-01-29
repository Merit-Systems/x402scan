import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';

import {
  collectPagePaths,
  collectSectionPaths,
  findPageLocation,
  findSection,
} from '../../_lib/navigation';

import type { Route } from 'next';
import { knowledgeWorkGuide } from '../_content/data';

const GUIDE_SLUG = 'knowledge-work';

export default async function Page({
  params,
}: PageProps<'/mcp/guide/knowledge-work/[[...path]]'>) {
  const { path: rawPath } = await params;
  let path = rawPath?.length ? rawPath : ['index'];

  const guide = await knowledgeWorkGuide;

  // If the path points to a section, append 'index' to load the section's index page
  const section = findSection(guide.items, path);
  if (section) {
    path = [...path, 'index'];
  }

  const pageLocation = findPageLocation(guide.items, path);

  if (!pageLocation) {
    notFound();
  }

  const pageSectionIndex = pageLocation.section?.items.findIndex(
    item => item.slug === pageLocation.page.slug
  );
  const nextPage =
    pageSectionIndex !== undefined
      ? pageLocation.section?.items[pageSectionIndex + 1]
      : null;

  const mdxPath = path.join('/');
  const { default: Content } = (await import(
    `@/app/mcp/guide/${GUIDE_SLUG}/_content/${mdxPath}.mdx`
  )) as { default: React.ComponentType };

  return (
    <div className="flex flex-col gap-20">
      <div>
        <Content />
      </div>

      {nextPage && (
        <div className="flex flex-col gap-6 border py-8 px-4 rounded-xl items-center text-center">
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
  const guide = await knowledgeWorkGuide;
  const pagePaths = collectPagePaths(guide.items);
  const sectionPaths = collectSectionPaths(guide.items);

  // Include empty path for the base route, section paths, and all page paths
  return [
    { path: [] },
    ...sectionPaths.map(path => ({ path })),
    ...pagePaths.map(path => ({ path })),
  ];
}

export const dynamicParams = false;
