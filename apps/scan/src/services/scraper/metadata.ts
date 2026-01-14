interface Metadata {
  title?: string;
  description?: string;
  url?: string;
}

/**
 * Extracts the content from a meta tag
 * Uses separate patterns for double-quoted and single-quoted values to handle quotes in content
 */
const extractMetaContent = (
  html: string,
  nameOrProperty: string
): string | null => {
  // Match meta tags with name or property attribute
  // Use separate patterns for each quote type to properly handle quotes in values
  const patterns = [
    // name attribute with double-quoted content
    new RegExp(
      `<meta\\s+[^>]*name\\s*=\\s*["']${nameOrProperty}["'][^>]*content\\s*=\\s*"([^"]*)"`,
      'i'
    ),
    // name attribute with single-quoted content
    new RegExp(
      `<meta\\s+[^>]*name\\s*=\\s*["']${nameOrProperty}["'][^>]*content\\s*=\\s*'([^']*)'`,
      'i'
    ),
    // content before name with double quotes
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*"([^"]*)"[^>]*name\\s*=\\s*["']${nameOrProperty}["']`,
      'i'
    ),
    // content before name with single quotes
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*'([^']*)'[^>]*name\\s*=\\s*["']${nameOrProperty}["']`,
      'i'
    ),
    // property attribute with double-quoted content
    new RegExp(
      `<meta\\s+[^>]*property\\s*=\\s*["']${nameOrProperty}["'][^>]*content\\s*=\\s*"([^"]*)"`,
      'i'
    ),
    // property attribute with single-quoted content
    new RegExp(
      `<meta\\s+[^>]*property\\s*=\\s*["']${nameOrProperty}["'][^>]*content\\s*=\\s*'([^']*)'`,
      'i'
    ),
    // content before property with double quotes
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*"([^"]*)"[^>]*property\\s*=\\s*["']${nameOrProperty}["']`,
      'i'
    ),
    // content before property with single quotes
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*'([^']*)'[^>]*property\\s*=\\s*["']${nameOrProperty}["']`,
      'i'
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Extracts the title from a <title> tag
 */
const extractTitle = (html: string): string | null => {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return match?.[1]?.trim() ?? null;
};

/**
 * Extracts the canonical URL from a link tag
 */
const extractCanonicalUrl = (html: string): string | null => {
  const match =
    /<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i.exec(
      html
    );
  if (match?.[1]) return match[1];

  // Try alternate attribute order
  const altMatch =
    /<link\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["'][^>]*>/i.exec(
      html
    );
  return altMatch?.[1] ?? null;
};

/**
 * Parses metadata from an HTML string
 */
export const parseMetadataFromHtml = (html: string): Metadata | null => {
  try {
    const title = extractTitle(html) ?? extractMetaContent(html, 'title');
    const description = extractMetaContent(html, 'description');
    const url = extractCanonicalUrl(html);

    if (!title && !description && !url) {
      return null;
    }

    return {
      title: title ?? undefined,
      description: description ?? undefined,
      url: url ?? undefined,
    };
  } catch {
    return null;
  }
};
