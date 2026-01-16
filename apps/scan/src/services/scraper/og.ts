import ogs from 'open-graph-scraper';

/**
 * Parses Open Graph data from an HTML string
 */
export const parseOgFromHtml = async (html: string) => {
  try {
    const result = await ogs({ html });
    if (result.error) {
      return null;
    }
    return result.result;
  } catch {
    return null;
  }
};
