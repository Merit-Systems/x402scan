export const getWebPageMetadata = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    const title = titleMatch
      ? titleMatch[1]!.trim().replace(/\s+/g, ' ')
      : null;

    // Extract description from meta tags
    // Try standard meta description first
    let descriptionMatch =
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(html);

    // If not found, try og:description
    descriptionMatch ??=
      /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i.exec(
        html
      );

    // Also check for reversed attribute order
    descriptionMatch ??=
      /<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i.exec(html);

    descriptionMatch ??=
      /<meta\s+content=["']([^"']*)["']\s+property=["']og:description["']/i.exec(
        html
      );

    const description = descriptionMatch
      ? descriptionMatch[1]!.trim().replace(/\s+/g, ' ')
      : null;

    return {
      title,
      description,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch web page metadata: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
