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
export interface NavPage {
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

export type Guides = Record<string, Guide>;

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

const getNavItems = (contentDir: string): NavItem[] => {
  const meta = parseMeta(contentDir);

  return meta.items.map(({ type, slug }): NavItem => {
    if (type === 'section') {
      const sectionDir = path.join(contentDir, slug);
      const meta = parseMeta(sectionDir);
      return {
        type: 'section',
        slug,
        ...meta,
        items: getNavItems(sectionDir),
      };
    } else {
      return {
        type: 'page',
        slug,
      };
    }
  });
};

export const getGuide = (...dir: string[]): Guide => {
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
    items: getNavItems(contentDir),
  };
};
