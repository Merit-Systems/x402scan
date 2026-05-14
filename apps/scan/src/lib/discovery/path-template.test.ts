import { describe, expect, it } from 'vitest';

import { templatizePath } from './path-template';

/**
 * Real war-tracker.com `info.x-guidance` snippet — they deliberately use
 * concrete path keys in `paths` and document the canonical templates here.
 */
const WAR_TRACKER_GUIDANCE = `
3. **Paid resources** (x402-paid for training-crawler UAs):
   \`/share/{event_id}/{slug}\`, \`/media/{event_id}\`, \`/region/{slug}\`,
   \`/country/{iso2}\`, \`/event-type/{slug}\`.
`;

describe('templatizePath', () => {
  describe('passthrough', () => {
    it('returns templated paths unchanged', () => {
      expect(
        templatizePath('https://example.com/api/v1/events/{event_id}')
      ).toBe('https://example.com/api/v1/events/{event_id}');
    });

    it('returns list endpoints unchanged', () => {
      expect(templatizePath('https://example.com/api/v1/events')).toBe(
        'https://example.com/api/v1/events'
      );
    });

    it('returns invalid urls unchanged', () => {
      expect(templatizePath('not a url')).toBe('not a url');
    });

    it('leaves common-noun segments alone when no hint is provided', () => {
      // No false-positives on `events`, `accounts`, etc.
      expect(templatizePath('https://example.com/api/v1/events')).toBe(
        'https://example.com/api/v1/events'
      );
    });
  });

  describe('heuristic templating (no hints)', () => {
    it('templates numeric id segments', () => {
      expect(templatizePath('https://example.com/api/v1/events/397003')).toBe(
        'https://example.com/api/v1/events/{id}'
      );
    });

    it('templates UUID segments', () => {
      expect(
        templatizePath(
          'https://example.com/users/550e8400-e29b-41d4-a716-446655440000'
        )
      ).toBe('https://example.com/users/{id}');
    });

    it('templates a slug segment that follows a numeric id', () => {
      expect(templatizePath('https://example.com/share/397003/strike')).toBe(
        'https://example.com/share/{id}/{slug}'
      );
    });

    it('leaves kebab-case segments alone without a hint', () => {
      // Conservative: we don't know if `middle-east` is a slug or a literal.
      expect(templatizePath('https://example.com/region/middle-east')).toBe(
        'https://example.com/region/middle-east'
      );
    });
  });

  describe('mining hints (war-tracker spec)', () => {
    it('uses the providers param name from operation summary', () => {
      expect(
        templatizePath('https://war-tracker.com/api/v1/events/397003', {
          operationSummary:
            'Single event at /api/v1/events/{event_id}. Returns the canonical payload.',
        })
      ).toBe('https://war-tracker.com/api/v1/events/{event_id}');
    });

    it('templates a slug-less share URL using a longer template from the description', () => {
      expect(
        templatizePath('https://war-tracker.com/share/397003', {
          operationSummary:
            'Slug-less variant of /share/{event_id}/{slug}. Redirects to the canonical URL.',
        })
      ).toBe('https://war-tracker.com/share/{event_id}');
    });

    it('templates the full share/{id}/{slug} pattern', () => {
      expect(
        templatizePath('https://war-tracker.com/share/397003/strike', {
          operationSummary:
            'Per-event article at /share/{event_id}/{slug}. Default response is the SEO-canonical HTML page.',
        })
      ).toBe('https://war-tracker.com/share/{event_id}/{slug}');
    });

    it('templates /media/{event_id} via operation summary', () => {
      expect(
        templatizePath('https://war-tracker.com/media/397003', {
          operationSummary:
            'Full media bytes (photo or video) for an event at /media/{event_id}. Flat price.',
        })
      ).toBe('https://war-tracker.com/media/{event_id}');
    });

    it('templates /region/{slug} via doc-level guidance', () => {
      expect(
        templatizePath('https://war-tracker.com/region/middle-east', {
          guidance: WAR_TRACKER_GUIDANCE,
        })
      ).toBe('https://war-tracker.com/region/{slug}');
    });

    it('templates /country/{iso2} via doc-level guidance', () => {
      expect(
        templatizePath('https://war-tracker.com/country/UA', {
          guidance: WAR_TRACKER_GUIDANCE,
        })
      ).toBe('https://war-tracker.com/country/{iso2}');
    });

    it('templates /event-type/{slug} via doc-level guidance', () => {
      expect(
        templatizePath('https://war-tracker.com/event-type/drone-strike', {
          guidance: WAR_TRACKER_GUIDANCE,
        })
      ).toBe('https://war-tracker.com/event-type/{slug}');
    });

    it('falls back to heuristics when hints do not mention the path', () => {
      // No template for /widgets/* in hints → numeric still becomes {id}.
      expect(
        templatizePath('https://example.com/widgets/12345', {
          guidance: WAR_TRACKER_GUIDANCE,
        })
      ).toBe('https://example.com/widgets/{id}');
    });

    it('prefers the longer template when multiple match the same prefix', () => {
      // Two share templates in hint text: pick the more specific one.
      expect(
        templatizePath('https://example.com/share/397003/strike', {
          operationSummary:
            'See /share/{id} for the slug-less variant, or /share/{event_id}/{slug} for the canonical URL.',
        })
      ).toBe('https://example.com/share/{event_id}/{slug}');
    });

    it('preserves query strings on the URL', () => {
      // The discovery pipeline strips query before storage, but templatize
      // itself should be a pure path-mutation transform.
      expect(
        templatizePath('https://example.com/api/v1/events/397003?foo=bar', {
          operationSummary: 'Event at /api/v1/events/{event_id}',
        })
      ).toBe('https://example.com/api/v1/events/{event_id}?foo=bar');
    });
  });

  describe('full war-tracker resource set', () => {
    // The combined hint text — guidance for hub-page routes,
    // descriptions for the others. Matches the real OpenAPI spec.
    const cases: { input: string; summary?: string; expected: string }[] = [
      {
        input: 'https://war-tracker.com/api/v1/events',
        expected: 'https://war-tracker.com/api/v1/events',
      },
      {
        input: 'https://war-tracker.com/api/v1/events/397003',
        summary:
          'Single event at /api/v1/events/{event_id}. Returns the canonical machine-readable event payload.',
        expected: 'https://war-tracker.com/api/v1/events/{event_id}',
      },
      {
        input: 'https://war-tracker.com/share/397003',
        summary:
          'Slug-less variant of /share/{event_id}/{slug}. The server redirects to the canonical URL.',
        expected: 'https://war-tracker.com/share/{event_id}',
      },
      {
        input: 'https://war-tracker.com/share/397003/strike',
        summary:
          'Per-event article at /share/{event_id}/{slug}. Default response is the SEO-canonical HTML page.',
        expected: 'https://war-tracker.com/share/{event_id}/{slug}',
      },
      {
        input: 'https://war-tracker.com/media/397003',
        summary: 'Full media bytes for an event at /media/{event_id}.',
        expected: 'https://war-tracker.com/media/{event_id}',
      },
      {
        input: 'https://war-tracker.com/region/middle-east',
        expected: 'https://war-tracker.com/region/{slug}',
      },
      {
        input: 'https://war-tracker.com/country/UA',
        expected: 'https://war-tracker.com/country/{iso2}',
      },
      {
        input: 'https://war-tracker.com/event-type/drone-strike',
        expected: 'https://war-tracker.com/event-type/{slug}',
      },
    ];

    it.each(cases)(
      'templatizes $input → $expected',
      ({ input, summary, expected }) => {
        const result = templatizePath(input, {
          operationSummary: summary,
          guidance: WAR_TRACKER_GUIDANCE,
        });
        expect(result).toBe(expected);
      }
    );
  });
});
