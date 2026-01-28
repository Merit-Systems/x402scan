import fs from 'fs';
import path from 'path';

interface GuideMetadata {
  title: string;
  description: string;
  pages: string[];
}

export interface Metadata {
  title: string;
  description: string;
}

export interface Guide extends Omit<GuideMetadata, 'pages'> {
  pages: { metadata: Metadata; slug: string }[];
}

export type Guides = Record<string, Guide>;

export const getGuide = async (...dir: string[]): Promise<Guide> => {
  const guideDir = path.join(
    process.cwd(),
    'src',
    'app',
    'mcp',
    'guide',
    ...dir
  );

  const meta = JSON.parse(
    fs.readFileSync(path.join(guideDir, 'meta.json'), 'utf8')
  ) as GuideMetadata;
  const lessonsData = await Promise.all(
    meta.pages.map(async lesson => {
      const { metadata } = (await import(
        `../_content/${guide}/${lesson}.mdx`
      )) as { metadata: Metadata };
      if (!metadata) {
        throw new Error(`No metadata found for ${lesson}`);
      }
      return {
        metadata,
        slug: path.basename(lesson, path.extname(lesson)),
      };
    })
  );

  const guides = fs
    .readdirSync(contentDir)
    .filter(file => fs.statSync(path.join(contentDir, file)).isDirectory());

  const guidesData = await Promise.all(
    guides.map(async guide => {
      return { slug: guide, metadata: meta, pages: lessonsData };
    })
  );
  return guidesData.reduce((acc, { slug, metadata, pages }) => {
    acc[slug] = { ...metadata, pages };
    return acc;
  }, {} as Guides);
};
