import { resultFromPromise } from '@x402scan/neverthrow';
import { fetchErr, safeFetch } from '@x402scan/neverthrow/fetch';

import type { BaseFetchError, FetchErrorType } from '@x402scan/neverthrow/types';

const surface = 'getWebPageMetadata';

interface WebPageMetadata {
  title: string | null;
  description: string | null;
}

export const getWebPageMetadata = (url: string) => {
  return safeFetch(surface, new Request(url)).andThen(response => {
    if (!response.ok) {
      return fetchErr(surface, {
        type: 'http' as const,
        message: 'HTTP error',
        status: response.status,
        response,
      });
    }

    return resultFromPromise<
      FetchErrorType,
      typeof surface,
      BaseFetchError,
      WebPageMetadata
    >(surface, parseMetadataFromResponse(response), error => ({
      type: 'parse' as const,
      message: 'Could not parse metadata from response',
      error: error instanceof Error ? error : new Error(String(error)),
      statusCode: response.status,
      contentType: response.headers.get('content-type') ?? 'Not specified',
    }));
  });
};

const parseMetadataFromResponse = async (
  response: Response
): Promise<WebPageMetadata> => {
  const html = await response.text();

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
