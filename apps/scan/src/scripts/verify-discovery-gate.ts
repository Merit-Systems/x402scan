/**
 * One-off verification: simulate registerResourcesFromDiscovery's gating
 * (siwx → register / openapi non-paid → skip / paid → probe) and print
 * the totals that the patched register-origin endpoint should return.
 *
 * Usage: pnpm tsx src/scripts/verify-discovery-gate.ts [origin]
 */
import { fetchDiscoveryDocument } from '../services/discovery';
import { probeX402Endpoint } from '../lib/discovery/probe';

async function main() {
  const origin = process.argv[2] ?? 'https://stableupload.dev';
  console.log(`\n=== ${origin} ===`);

  const doc = await fetchDiscoveryDocument(origin);
  if (!doc.success) {
    console.error('Discovery failed:', doc.error);
    process.exit(1);
  }
  console.log(`source=${doc.source}  resources=${doc.resources.length}\n`);

  let registered = 0;
  let siwx = 0;
  let skipped = 0;
  let failed = 0;

  for (const resource of doc.resources) {
    if (resource.authMode === 'siwx') {
      console.log(`SIWX  ${resource.url}`);
      siwx++;
      continue;
    }

    if (
      doc.source === 'openapi' &&
      resource.authMode !== 'paid' &&
      resource.authMode !== 'apiKey+paid'
    ) {
      console.log(
        `SKIP  ${resource.url}  (authMode=${resource.authMode ?? 'unspecified'})`
      );
      skipped++;
      continue;
    }

    const result = await probeX402Endpoint(resource.url, resource.method);
    if (!result.success) {
      console.log(`FAIL  ${resource.url}\n      → ${result.error}`);
      failed++;
      continue;
    }
    console.log(`OK    ${resource.url}  (${result.advisory.method})`);
    registered++;
  }

  console.log(
    `\nTotals: registered=${registered} siwx=${siwx} skipped=${skipped} failed=${failed}`
  );
  if (failed > 0) process.exit(1);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
