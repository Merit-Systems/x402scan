import { parser } from 'html-metadata-parser';

export const scrapeMetadata = async (url: string) => {
  try {
    const metadata = await parser(url);
    return metadata.og;
  } catch {
    return null;
  }
};
