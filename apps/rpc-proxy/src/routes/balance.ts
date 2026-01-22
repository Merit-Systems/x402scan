import type { Context, Hono } from 'hono';

import { Connection, PublicKey } from '@solana/web3.js';
import { createPublicClient, formatEther, getAddress, http, isAddress } from 'viem';
import { base } from 'viem/chains';

type Chain = 'base' | 'solana';

const LAMPORTS_PER_SOL = 1_000_000_000;

function formatLamportsToSol(lamports: number): string {
  const whole = Math.floor(lamports / LAMPORTS_PER_SOL);
  const frac = lamports % LAMPORTS_PER_SOL;
  if (frac === 0) return String(whole);
  const fracStr = String(frac).padStart(9, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

function parseSolanaPublicKey(input: string): PublicKey | null {
  try {
    return new PublicKey(input);
  } catch {
    return null;
  }
}

function createBaseClient() {
  const rpcUrl = process.env.BASE_RPC_URL;
  if (!rpcUrl) {
    throw new Error('Missing BASE_RPC_URL');
  }
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
}

let solanaConnection: Connection | undefined;
function getSolanaConnection() {
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('Missing SOLANA_RPC_URL');
  }
  solanaConnection ??= new Connection(rpcUrl, 'confirmed');
  return solanaConnection;
}

async function balanceHandler(c: Context) {
  const addressParam = c.req.param('address');

  // EVM (Base)
  if (isAddress(addressParam)) {
    const address = getAddress(addressParam);
    try {
      const client = createBaseClient();
      const wei = await client.getBalance({ address });
      const eth = formatEther(wei);
      return c.json(
        { chain: 'base' satisfies Chain, address, balance: eth },
        200,
        { 'Cache-Control': 'no-store' }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('Missing BASE_RPC_URL') ? 500 : 502;
      return c.json({ error: message }, status);
    }
  }

  // Solana
  const pubkey = parseSolanaPublicKey(addressParam);
  if (pubkey) {
    try {
      const connection = getSolanaConnection();
      const lamports = await connection.getBalance(pubkey, 'confirmed');
      const sol = formatLamportsToSol(lamports);
      return c.json(
        {
          chain: 'solana' satisfies Chain,
          address: pubkey.toBase58(),
          balance: sol,
        },
        200,
        { 'Cache-Control': 'no-store' }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('Missing SOLANA_RPC_URL') ? 500 : 502;
      return c.json({ error: message }, status);
    }
  }

  return c.json({ error: 'Invalid address' }, 400);
}

export function registerBalanceRouter(app: Hono) {
  app.get('/balance/:address', balanceHandler);
}

