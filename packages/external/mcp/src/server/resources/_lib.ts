import { err, ok } from '@x402scan/neverthrow';
import { safeFetch, safeParseResponse } from '@/shared/neverthrow/fetch';

const surface = 'getWebPageMetadata';

interface WebPageMetadata {
  title: string | null;
  description: string | null;
}

export const getWebPageMetadata = (url: string) => {
  return safeFetch(surface, new Request(url))
    .andThen(response => safeParseResponse(surface, response))
    .andThen(parsedResponse => {
      if (parsedResponse.type === 'text') {
        return ok(parseMetadataFromResponse(parsedResponse.data));
      }
      return err('user', surface, {
        cause: 'invalid_response_type',
        message: 'Invalid response type',
      });
    });
};

const parseMetadataFromResponse = (html: string): WebPageMetadata => {
  // Extract title
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch ? titleMatch[1]!.trim().replace(/\s+/g, ' ') : null;

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
};
