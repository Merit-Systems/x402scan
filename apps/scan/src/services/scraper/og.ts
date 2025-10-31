import ogs from 'open-graph-scraper';

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
