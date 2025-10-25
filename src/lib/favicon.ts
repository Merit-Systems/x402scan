export const getFaviconUrl = (favicon: string, scrapedOrigin: string) => {
  return favicon.startsWith('/')
    ? scrapedOrigin.replace(/\/$/, '') + favicon
    : favicon;
};
