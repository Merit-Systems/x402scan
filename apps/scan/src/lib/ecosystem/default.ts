import type { EcosystemItem } from './schema';

export const defaultEcosystemItems: EcosystemItem[] = [
  {
    name: 'BridgeNode',
    description:
      'Pay-per-request AI chat completions (LLM inference) via x402 on Solana — no API keys, no accounts, pay with USDC.',
    logoUrl: 'https://www.x402.org/logos/bridgenode.jpg',
    websiteUrl: 'https://bridgenode.cc',
    category: 'Services/Endpoints',
  },
  {
    name: 'awesome-x402',
    description: 'A curated list of resources for the x402 ecosystem.',
    logoUrl: 'https://www.merit.systems/logo/dark.svg',
    websiteUrl: 'https://github.com/Merit-Systems/awesome-x402',
    category: 'Learning & Community Resources',
  },
];
