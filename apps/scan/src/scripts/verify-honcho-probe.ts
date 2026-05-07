/**
 * One-off verification: run the patched probeX402Endpoint against
 * agentcash.honcho.dev and confirm both paid endpoints return success
 * with full x402 paymentOptions + inputSchema.
 *
 * Usage:
 *   pnpm tsx src/scripts/verify-honcho-probe.ts [origin]
 */
import { Result } from 'better-result';

import { probeX402Endpoint } from '../lib/discovery/probe';
import { fetchDiscoveryDocument } from '../services/discovery';
import { isX402PaymentOption } from '../lib/discovery/utils';

async function main() {
  const origin = process.argv[2] ?? 'https://agentcash.honcho.dev';
  console.log(`Discovering ${origin}...\n`);

  const doc = await fetchDiscoveryDocument(origin);
  if (!doc.success) {
    console.error('Discovery failed:', doc.error);
    process.exit(1);
  }
  console.log(
    `Source: ${doc.source ?? 'unknown'}  Resources: ${doc.resources.length}\n`
  );

  let okCount = 0;
  let failCount = 0;
  for (const resource of doc.resources) {
    const tag = resource.authMode ?? 'unknown';
    if (resource.authMode === 'siwx') {
      console.log(`SIWX  ${resource.url}`);
      okCount++;
      continue;
    }

    const result = await probeX402Endpoint(resource.url, resource.method);
    if (Result.isError(result)) {
      console.log(
        `FAIL  ${resource.url}\n      → ${result.error._tag}: ${result.error.message}`
      );
      failCount++;
      continue;
    }

    const x402Opts = (result.value.advisory.paymentOptions ?? []).filter(
      isX402PaymentOption
    );
    const o = x402Opts[0];
    const amount = o
      ? 'amount' in o
        ? o.amount
        : 'maxAmountRequired' in o
          ? o.maxAmountRequired
          : '?'
      : '?';
    console.log(
      `OK    ${resource.url}\n      tag=${tag}  source=${result.value.advisory.source}  ` +
        `inputSchema=${!!result.value.advisory.inputSchema}  ` +
        `x402=${x402Opts.length}  network=${o?.network ?? '?'}  amount=${amount}`
    );
    okCount++;
  }

  console.log(`\nDone: ${okCount} ok, ${failCount} failed`);
  if (failCount > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
