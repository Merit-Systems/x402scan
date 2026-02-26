import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'x402scan API',
    version: '1.0.0',
    description:
      'Query indexed x402 payment data (merchants, wallets, facilitators, resources) and send USDC on Base and Solana.',
  },
  servers: [{ url: 'https://x402scan.com' }],
  paths: {
    '/api/send': {
      post: {
        summary: 'Send USDC to an address on Base or Solana',
        'x-payment-info': { price: 0, protocols: ['x402'] },
        parameters: [
          {
            name: 'amount',
            in: 'query',
            required: true,
            schema: { type: 'number' },
            description: 'Amount of USDC to send',
          },
          {
            name: 'address',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Recipient wallet address (EVM or Solana)',
          },
          {
            name: 'chain',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['base', 'solana'] },
            description: 'Target chain',
          },
        ],
        responses: {
          '200': { description: 'Send confirmation' },
        },
      },
    },
    '/api/data/merchants': {
      get: {
        summary: 'List top merchants by volume, transaction count, or unique buyers',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Page index (0-based)' },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 }, description: 'Items per page' },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] }, description: 'Filter by chain' },
          { name: 'timeframe', in: 'query', schema: { type: 'integer', enum: [1, 7, 14, 30] }, description: 'Days lookback' },
          { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['volume', 'tx_count', 'unique_buyers'], default: 'volume' }, description: 'Sort field' },
        ],
        responses: { '200': { description: 'Paginated list of merchants' } },
      },
    },
    '/api/data/merchants/{address}/transactions': {
      get: {
        summary: 'List transactions for a specific merchant',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'address', in: 'path', required: true, schema: { type: 'string' }, description: 'Merchant wallet address' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
          { name: 'timeframe', in: 'query', schema: { type: 'integer', enum: [1, 7, 14, 30] } },
          { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['time', 'amount'], default: 'time' } },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: { '200': { description: 'Paginated merchant transactions' } },
      },
    },
    '/api/data/merchants/{address}/stats': {
      get: {
        summary: 'Get aggregated stats for a specific merchant',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'address', in: 'path', required: true, schema: { type: 'string' }, description: 'Merchant wallet address' },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
          { name: 'timeframe', in: 'query', schema: { type: 'integer', enum: [1, 7, 14, 30] } },
        ],
        responses: { '200': { description: 'Merchant stats' } },
      },
    },
    '/api/data/wallets/{address}/transactions': {
      get: {
        summary: 'List transactions for a specific wallet (as sender)',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'address', in: 'path', required: true, schema: { type: 'string' }, description: 'Wallet address' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
          { name: 'timeframe', in: 'query', schema: { type: 'integer', enum: [1, 7, 14, 30] } },
          { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['time', 'amount'], default: 'time' } },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: { '200': { description: 'Paginated wallet transactions' } },
      },
    },
    '/api/data/wallets/{address}/stats': {
      get: {
        summary: 'Get aggregated stats for a specific wallet',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'address', in: 'path', required: true, schema: { type: 'string' }, description: 'Wallet address' },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
          { name: 'timeframe', in: 'query', schema: { type: 'integer', enum: [1, 7, 14, 30] } },
        ],
        responses: { '200': { description: 'Wallet stats' } },
      },
    },
    '/api/data/facilitators': {
      get: {
        summary: 'List top facilitators by transaction count',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
          { name: 'timeframe', in: 'query', schema: { type: 'integer', enum: [1, 7, 14, 30] } },
        ],
        responses: { '200': { description: 'Paginated list of facilitators' } },
      },
    },
    '/api/data/facilitators/stats': {
      get: {
        summary: 'Get aggregated facilitator stats across the network',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
          { name: 'timeframe', in: 'query', schema: { type: 'integer', enum: [1, 7, 14, 30] } },
        ],
        responses: { '200': { description: 'Network-wide facilitator stats' } },
      },
    },
    '/api/data/resources': {
      get: {
        summary: 'List registered x402 resources',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
        ],
        responses: { '200': { description: 'Paginated list of resources' } },
      },
    },
    '/api/data/resources/search': {
      get: {
        summary: 'Search registered x402 resources by keyword, tags, or chains',
        'x-payment-info': { price: 0.02, protocols: ['x402'] },
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'tags', in: 'query', schema: { type: 'string' }, description: 'Comma-separated tag IDs' },
          { name: 'chains', in: 'query', schema: { type: 'string' }, description: 'Comma-separated chains (base, solana)' },
        ],
        responses: { '200': { description: 'Search results' } },
      },
    },
    '/api/data/origins/{id}/resources': {
      get: {
        summary: 'List resources for a specific origin',
        'x-payment-info': { price: 0.01, protocols: ['x402'] },
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Origin ID' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'page_size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'chain', in: 'query', schema: { type: 'string', enum: ['base', 'solana'] } },
        ],
        responses: { '200': { description: 'Paginated list of origin resources' } },
      },
    },
  },
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=3600',
};

export const GET = () => NextResponse.json(spec, { headers });
