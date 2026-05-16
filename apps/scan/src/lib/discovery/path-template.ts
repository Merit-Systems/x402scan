/**
 * Templatize a concrete URL into its canonical templated form.
 *
 * Some OpenAPI providers (e.g. war-tracker.com) deliberately use concrete
 * path keys like `/api/v1/events/397003` instead of `/api/v1/events/{event_id}`
 * so that discovery probes hit a real URL. Their canonical templates are
 * documented either in the operation's summary/description or in the
 * doc-level `info.x-guidance` text.
 *
 * Resolution order:
 *   1. URL already contains `{...}` segments  → return as-is.
 *   2. Mine the hint text for templated paths that share a prefix with
 *      our URL; pick the strongest match and substitute the templated
 *      segment names at concrete positions.
 *   3. For any remaining concrete-looking segments, apply heuristics:
 *        - numeric, UUID, long hex   → `{id}`
 *        - any segment immediately
 *          after an `{id}` segment   → `{slug}`
 *      Ambiguous segments are left untouched (avoids false-positives on
 *      common nouns like `events`, `accounts`).
 *
 * Heuristics only run when the hint mining doesn't supply a name. This
 * lets providers control the param names they expose (e.g. `{event_id}`,
 * `{iso2}`) instead of getting our generic `{id}` / `{code}`.
 */

const TEMPLATE_PARAM_REGEX = /^\{[^/{}]+\}$/;

/** Pattern for path-like strings, possibly containing `{param}` placeholders. */
const PATH_PATTERN_REGEX = /\/[A-Za-z0-9_{}\-.]+(?:\/[A-Za-z0-9_{}\-.]+)*/g;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface TemplatizeHints {
  /** Operation `summary` (which already falls back to `description` upstream). */
  operationSummary?: string;
  /** Doc-level `info.x-guidance` text. */
  guidance?: string;
}

export function templatizePath(url: string, hints: TemplatizeHints = {}): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  // `URL.pathname` percent-encodes `{` / `}` on parse, so decode each
  // segment before inspection. (Real-world OpenAPI templates use the
  // literal `{param}` form.)
  const segments = parsed.pathname
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  if (segments.length === 0) return url;

  // Already templated — preserve as-is (with decoded braces).
  if (segments.some((s) => TEMPLATE_PARAM_REGEX.test(s))) {
    const newPath = '/' + segments.join('/');
    return `${parsed.origin}${newPath}${parsed.search}${parsed.hash}`;
  }

  const templates = mineTemplates(
    [hints.operationSummary, hints.guidance].filter(Boolean).join('\n')
  );

  const result = segments.map((segment, i) => {
    if (!looksConcrete(segment, segments, i)) return segment;

    const mined = findTemplateSegment(templates, segments, i);
    if (mined) return mined;

    return heuristicReplace(segment, segments, i) ?? segment;
  });

  // Rebuild by hand — the URL.pathname setter percent-encodes `{`/`}`,
  // which would mangle our template params back to `%7B...%7D`.
  const newPath = '/' + result.join('/');
  const trailing = `${parsed.search}${parsed.hash}`;
  return `${parsed.origin}${newPath}${trailing}`;
}

/**
 * Whether a segment "looks like" a concrete identifier that should
 * potentially be templated. We use a permissive definition here — we
 * let the mining + heuristic stages make the final call. The point of
 * this gate is to avoid invoking the (expensive) mining search on every
 * segment of every path.
 */
function looksConcrete(
  segment: string,
  segments: string[],
  position: number
): boolean {
  // Numeric or hex-ish → almost certainly an id.
  if (/^\d+$/.test(segment)) return true;
  if (UUID_REGEX.test(segment)) return true;
  if (/^[0-9a-f]{16,}$/i.test(segment)) return true;

  // ALL-CAPS short codes (e.g. country codes UA, US, GBR).
  if (/^[A-Z]{2,3}$/.test(segment)) return true;

  // A segment immediately after a {id}-shaped segment usually is a slug.
  const prev = position > 0 ? segments[position - 1] : undefined;
  if (prev && (/^\d+$/.test(prev) || UUID_REGEX.test(prev))) return true;

  // Kebab-case multi-word segment (e.g. `middle-east`, `drone-strike`) —
  // only flagged when there are templates available to mine, since
  // otherwise we'd over-templatize segments like `event-types`.
  if (segment.includes('-')) return true;

  return false;
}

/**
 * Extracts every `path-like` substring from the hint text and keeps the
 * ones containing at least one `{param}` placeholder.
 */
function mineTemplates(text: string): string[][] {
  if (!text) return [];
  const matches = text.match(PATH_PATTERN_REGEX) ?? [];
  const templates: string[][] = [];
  const seen = new Set<string>();
  for (const raw of matches) {
    // Strip trailing sentence/list punctuation that the regex greedily
    // pulled in (e.g. `/media/{event_id}.`, `/share/{event_id}/{slug},`).
    const path = raw.replace(/[.,;:!?)\]]+$/g, '');
    const segs = path.split('/').filter(Boolean);
    if (segs.length === 0) continue;
    if (!segs.some((s) => TEMPLATE_PARAM_REGEX.test(s))) continue;
    const key = segs.join('/');
    if (seen.has(key)) continue;
    seen.add(key);
    templates.push(segs);
  }
  return templates;
}

/**
 * Finds the best templated segment to use at `position` in `urlSegments`,
 * scanning all mined templates. A template is eligible iff:
 *   - It has a `{param}` at the requested position.
 *   - All preceding positions are prefix-compatible (literal segments
 *     match, template params are wildcards).
 *
 * Among eligible templates, we pick the one with the most literal-prefix
 * matches (ties broken by overall template length to prefer longer,
 * more-specific templates).
 */
function findTemplateSegment(
  templates: string[][],
  urlSegments: string[],
  position: number
): string | null {
  let best: { segment: string; literalMatches: number; length: number } | null =
    null;

  for (const template of templates) {
    if (position >= template.length) continue;
    const candidate = template[position];
    if (!candidate || !TEMPLATE_PARAM_REGEX.test(candidate)) continue;

    let literalMatches = 0;
    let compatible = true;
    for (let i = 0; i < position; i++) {
      const tSeg = template[i];
      const uSeg = urlSegments[i];
      if (!tSeg || !uSeg) {
        compatible = false;
        break;
      }
      if (TEMPLATE_PARAM_REGEX.test(tSeg)) continue;
      if (tSeg === uSeg) {
        literalMatches++;
        continue;
      }
      compatible = false;
      break;
    }
    if (!compatible) continue;

    if (
      !best ||
      literalMatches > best.literalMatches ||
      (literalMatches === best.literalMatches && template.length > best.length)
    ) {
      best = { segment: candidate, literalMatches, length: template.length };
    }
  }

  return best?.segment ?? null;
}

function heuristicReplace(
  segment: string,
  segments: string[],
  position: number
): string | null {
  if (/^\d+$/.test(segment)) return '{id}';
  if (UUID_REGEX.test(segment)) return '{id}';
  if (/^[0-9a-f]{16,}$/i.test(segment)) return '{id}';

  const prev = position > 0 ? segments[position - 1] : undefined;
  if (prev && (/^\d+$/.test(prev) || UUID_REGEX.test(prev))) return '{slug}';

  // ALL-CAPS short codes only when there's a categorical prev segment
  // — refuse without context to avoid false-positives like `/api/UA`.
  // Without mining, leave them alone.

  return null;
}
