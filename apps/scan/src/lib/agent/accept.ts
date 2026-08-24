/**
 * `Accept` header negotiation between the HTML and Markdown representations
 * of a page, following https://acceptmarkdown.com (and RFC 9110 §12.5.1):
 *
 *   - for each representation we can produce, find the best-matching Accept
 *     entry: exact type > `text/*` > `*\/*`;
 *   - score = that entry's q-value (0 when nothing matches or q=0);
 *   - highest score wins; ties are broken by specificity, then by HTML
 *     (browsers never ask for markdown explicitly, so HTML stays the default);
 *   - if every score is 0 the request is not acceptable (406).
 */

export type NegotiatedFormat = 'html' | 'markdown' | 'not-acceptable';

const MARKDOWN_MEDIA_TYPE = 'text/markdown';
const HTML_MEDIA_TYPE = 'text/html';

interface AcceptEntry {
  type: string;
  subtype: string;
  q: number;
  /** Position in the header, used only as a stable tiebreak. */
  index: number;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(',')
    .map((raw, index) => {
      const [mediaRange = '', ...params] = raw.trim().split(';');
      const [type = '*', subtype = '*'] = mediaRange
        .trim()
        .toLowerCase()
        .split('/');
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split('=');
        if (key?.trim().toLowerCase() === 'q' && value !== undefined) {
          const parsed = Number.parseFloat(value);
          q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
        }
      }
      return { type, subtype, q, index };
    })
    .filter(entry => entry.type.length > 0);
}

/** Specificity rank: 2 = exact, 1 = `type/*`, 0 = `*\/*`, -1 = no match. */
function matchRank(entry: AcceptEntry, type: string, subtype: string) {
  if (entry.type === type && entry.subtype === subtype) return 2;
  if (entry.type === type && entry.subtype === '*') return 1;
  if (entry.type === '*' && entry.subtype === '*') return 0;
  return -1;
}

function bestMatch(entries: AcceptEntry[], mediaType: string) {
  const [type = '', subtype = ''] = mediaType.split('/');
  let best: { q: number; rank: number; index: number } | null = null;
  for (const entry of entries) {
    const rank = matchRank(entry, type, subtype);
    if (rank < 0) continue;
    if (!best || rank > best.rank) {
      best = { q: entry.q, rank, index: entry.index };
    }
  }
  return best ?? { q: 0, rank: -1, index: Number.MAX_SAFE_INTEGER };
}

/**
 * Decide which representation to serve for a page that exists in both HTML
 * and Markdown. A missing or empty `Accept` header means "anything" (HTML).
 */
export function negotiateFormat(
  acceptHeader: string | null | undefined
): NegotiatedFormat {
  if (!acceptHeader || acceptHeader.trim() === '') return 'html';

  const entries = parseAccept(acceptHeader);
  if (entries.length === 0) return 'html';

  const html = bestMatch(entries, HTML_MEDIA_TYPE);
  const markdown = bestMatch(entries, MARKDOWN_MEDIA_TYPE);

  if (html.q === 0 && markdown.q === 0) return 'not-acceptable';
  if (markdown.q > html.q) return 'markdown';
  if (markdown.q < html.q) return 'html';
  // Equal q: more specific match wins; on a full tie the client listed both
  // explicitly, so honour whichever it named first.
  if (markdown.rank > html.rank) return 'markdown';
  if (markdown.rank < html.rank) return 'html';
  return markdown.index < html.index ? 'markdown' : 'html';
}
