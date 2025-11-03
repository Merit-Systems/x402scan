import { ecosystemItemSchema } from '@/lib/ecosystem/schema';

import type { EcosystemItem } from '@/lib/ecosystem/schema';

import { Octokit } from '@octokit/rest';

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const syncEcosystem = async () => {
  dotenv.config();

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const contents = await octokit.rest.repos.getContent({
    owner: 'coinbase',
    repo: 'x402',
    path: '/typescript/site/app/ecosystem/partners-data',
  });

  if (!Array.isArray(contents.data)) {
    return console.error('Not a directory');
  }

  const ecosystem: EcosystemItem[] = [];

  const promises = contents.data.map(async content => {
    const path = content.path;
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/coinbase/x402/main/${path}/metadata.json`
      );
      const data = ecosystemItemSchema.parse(await res.json());
      return data;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  ecosystem.push(
    ...results.filter((item): item is EcosystemItem => item !== null)
  );

  // Write to list.ts
  const outputPath = path.join(__dirname, '../lib/ecosystem/list.ts');

  const formatEcosystemArray = (items: EcosystemItem[]): string => {
    const itemStrings = items.map(
      item =>
        `  {
    name: ${JSON.stringify(item.name)},
    description: ${JSON.stringify(item.description)},
    logoUrl: ${JSON.stringify(item.logoUrl)},
    websiteUrl: ${JSON.stringify(item.websiteUrl)},
    category: ${JSON.stringify(item.category)},
  }`
    );
    return `[\n${itemStrings.join(',\n')},\n]`;
  };

  const fileContent = `import type { EcosystemItem } from './schema';

export const ecosystemItems: EcosystemItem[] = ${formatEcosystemArray(ecosystem)} as const;
`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`Successfully wrote ecosystem data to ${outputPath}`);
};

void syncEcosystem();
