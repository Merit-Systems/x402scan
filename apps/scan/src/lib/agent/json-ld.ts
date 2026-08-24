import { RATE_LIMIT } from '@/lib/agent/rate-limit-policy';

import type { JsonLdObject } from '@/components/json-ld';
import {
  NPM_MCP_URL,
  ORG,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  X_URL,
} from '@/lib/site';

/**
 * schema.org JSON-LD emitted on every page (root layout). Three graph nodes:
 *
 *   - `WebSite`           — site identity + SearchAction
 *   - `Organization`      — publisher with contactPoint + postal address so
 *                           agents can verify the business behind the site
 *   - `SoftwareApplication` — the product itself, with `Offer`s that make
 *                           pricing machine-readable (free site, $0.01–$0.02
 *                           per API request)
 */
export function buildSiteJsonLd(): JsonLdObject[] {
  const orgId = `${SITE_URL}/#organization`;
  const siteId = `${SITE_URL}/#website`;
  const appId = `${SITE_URL}/#software`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': siteId,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': orgId },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': orgId,
      name: SITE_NAME,
      legalName: ORG.legalName,
      alternateName: ORG.name,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
      description: `${SITE_NAME} is the x402 ecosystem explorer, analytics dashboard and marketplace for paid APIs, built and operated by ${ORG.name}.`,
      email: ORG.email,
      sameAs: [REPO_URL, X_URL, ORG.url, NPM_MCP_URL],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: ORG.email,
          url: `${SITE_URL}/contact`,
          availableLanguage: ['en'],
        },
        {
          '@type': 'ContactPoint',
          contactType: 'privacy',
          email: ORG.privacyEmail,
          url: `${SITE_URL}/privacy`,
          availableLanguage: ['en'],
        },
        {
          '@type': 'ContactPoint',
          contactType: 'technical support',
          url: `${REPO_URL}/issues`,
          availableLanguage: ['en'],
        },
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: ORG.address.streetAddress,
        addressLocality: ORG.address.addressLocality,
        addressRegion: ORG.address.addressRegion,
        postalCode: ORG.address.postalCode,
        addressCountry: ORG.address.addressCountry,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': appId,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'Blockchain explorer and API marketplace',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      author: { '@id': orgId },
      publisher: { '@id': orgId },
      softwareHelp: { '@type': 'CreativeWork', url: `${SITE_URL}/docs` },
      installUrl: `${SITE_URL}/mcp`,
      offers: [
        {
          '@type': 'Offer',
          name: 'Website and marketplace',
          description:
            'Explorer, marketplace, registry and dashboards are free to use.',
          price: '0',
          priceCurrency: 'USD',
          url: SITE_URL,
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Public API — data endpoints',
          description: `Pay-per-request via x402 in USDC. No subscription, no API key. ${RATE_LIMIT.limit} requests per ${RATE_LIMIT.windowSeconds}s per client.`,
          price: '0.01',
          priceCurrency: 'USD',
          url: `${SITE_URL}/pricing`,
          availability: 'https://schema.org/InStock',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '0.01',
            priceCurrency: 'USD',
            unitText: 'request',
          },
        },
        {
          '@type': 'Offer',
          name: 'Public API — resource search',
          description: 'Full-text search across indexed x402 resources.',
          price: '0.02',
          priceCurrency: 'USD',
          url: `${SITE_URL}/pricing`,
          availability: 'https://schema.org/InStock',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '0.02',
            priceCurrency: 'USD',
            unitText: 'request',
          },
        },
      ],
    },
  ];
}
