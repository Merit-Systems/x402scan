import fs from 'fs';
import path from 'path';
import z from 'zod';

const metadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});

type Metadata = z.infer<typeof metadataSchema>;

// Navigation tree node types
export interface NavPage extends Metadata {
  type: 'page';
  slug: string;
}

export interface NavSection extends Metadata {
  type: 'section';
  slug: string;
  items: NavItem[];
}

export type NavItem = NavPage | NavSection;

// Top-level guide structure
export interface Guide extends Metadata {
  items: NavItem[];
}

// Schema for meta.json files (used by both guides and sections)
const metaSchema = metadataSchema.extend({
  items: z
    .array(
      z
        .string()
        .refine(
          s =>
            /^([a-z0-9]+(-[a-z0-9]+)*|\.\.\.[a-z0-9]+(-[a-z0-9]+)*)$/.test(s),
          {
            message:
              "Each item must be a kebab-case string, or a kebab-case string prefixed with '...' for sections",
          }
        )
    )
    .transform(arr =>
      arr.map(slug =>
        slug.startsWith('...')
          ? { type: 'section' as const, slug: slug.slice(3) }
          : { type: 'page' as const, slug }
      )
    ),
});

const parseMeta = (dir: string) => {
  return metaSchema.parse(
    JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'))
  );
};

const basePath = path.join(process.cwd(), 'src', 'app', 'mcp', 'guide');

const getNavItems = async (contentDir: string): Promise<NavItem[]> => {
  const meta = parseMeta(contentDir);
  const relativePath = contentDir.replace(basePath, '').replace(/^\//, '');

  return Promise.all(
    meta.items.map(async ({ type, slug }): Promise<NavItem> => {
      if (type === 'section') {
        const sectionDir = path.join(contentDir, slug);
        const sectionMeta = parseMeta(sectionDir);
        return {
          type: 'section',
          slug,
          ...sectionMeta,
          items: await getNavItems(sectionDir),
        };
      } else {
        const mdxModule = (await import(
          `@/app/mcp/guide/${relativePath}/${slug}.mdx`
        )) as { metadata: unknown };
        const pageMetadata = metadataSchema.parse(mdxModule.metadata);
        return {
          type: 'page',
          slug,
          ...pageMetadata,
        };
      }
    })
  );
};

export const getGuide = async (...dir: string[]): Promise<Guide> => {
  const contentDir = path.join(
    process.cwd(),
    'src',
    'app',
    'mcp',
    'guide',
    ...dir,
    '_content'
  );

  const meta = parseMeta(contentDir);

  return {
    ...meta,
    items: await getNavItems(contentDir),
  };
};
