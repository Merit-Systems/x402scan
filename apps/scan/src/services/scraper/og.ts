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

/**
 * Fetches and parses Open Graph data from a URL
 * @deprecated Use parseOgFromHtml with fetchHtml for better efficiency
 */
export const scrapeOg = async (url: string) => {
  try {
    const result = await ogs({ url });
    if (result.error) {
      return null;
    }
    return result.result;
  } catch {
    return null;
  }
};
