#!/usr/bin/env node
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 4102);

const baseV1 = {
  x402Version: 1,
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '100',
      resource: 'https://fixture.local/protected',
      description: 'Fixture v1 endpoint',
      mimeType: 'application/json',
      payTo: '0x1234567890123456789012345678901234567890',
      maxTimeoutSeconds: 60,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      outputSchema: {
        input: {
          type: 'http',
          method: 'POST',
        },
        output: {
          type: 'object',
        },
      },
    },
  ],
};

const baseV2 = {
  x402Version: 2,
  accepts: [
    {
      scheme: 'exact',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      amount: '100',
      payTo: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
      maxTimeoutSeconds: 60,
      asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      extra: {},
    },
  ],
  resource: {
    url: 'https://fixture.local/protected',
    description: 'Fixture v2 endpoint',
    mimeType: 'application/json',
  },
  extensions: {
    bazaar: {
      info: {
        input: {
          type: 'http',
          method: 'POST',
          bodyType: 'json',
          body: {
            type: 'object',
            properties: {
              q: { type: 'string' },
            },
            required: ['q'],
          },
        },
        output: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
          },
        },
      },
    },
  },
};

function getPayload(pathname) {
  switch (pathname) {
    case '/case/solana-mainnet-beta-v1':
      return {
        ...baseV1,
        accepts: [
          {
            ...baseV1.accepts[0],
            network: 'solana-mainnet-beta',
          },
        ],
      };
    case '/case/invalid-caip-v2':
      return {
        ...baseV2,
        accepts: [
          {
            ...baseV2.accepts[0],
            network: 'solana-mainnet-beta',
          },
        ],
      };
    case '/case/missing-accepts-v2':
      return {
        x402Version: 2,
        resource: { ...baseV2.resource },
        extensions: { ...baseV2.extensions },
      };
    case '/case/missing-input-schema-v2':
      return {
        ...baseV2,
        extensions: {
          bazaar: {
            info: {
              output: {
                type: 'object',
              },
            },
          },
        },
      };
    case '/case/missing-output-schema-v2':
      return {
        ...baseV2,
        extensions: {
          bazaar: {
            info: {
              input: { ...baseV2.extensions.bazaar.info.input },
            },
          },
        },
      };
    case '/case/coinbase-structural-v1':
      return {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'base',
            maxAmountRequired: '100',
            payTo: '0x1234567890123456789012345678901234567890',
            maxTimeoutSeconds: 60,
            asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            outputSchema: {
              input: {
                type: 'http',
                method: 'GET',
              },
            },
          },
        ],
      };
    case '/case/accepts-not-array':
      return {
        ...baseV2,
        accepts: {
          scheme: 'exact',
        },
      };
    default:
      return baseV2;
  }
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (url.pathname === '/healthz') {
    return json(res, 200, { ok: true });
  }

  if (url.pathname.startsWith('/case/')) {
    return json(res, 402, getPayload(url.pathname));
  }

  return json(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`validator fixture listening on http://127.0.0.1:${PORT}`);
});
