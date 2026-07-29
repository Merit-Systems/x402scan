import type { EcosystemItem } from './schema';

export const defaultEcosystemItems: EcosystemItem[] = [
  {
    name: 'InsumerAPI',
    description:
      'Signed on-chain condition checks for AI agents: token balances, NFT ownership, EAS attestations, and agent standing (ERC-8004 registration, ERC-7710 delegation validity) across 38 chains. Pay per call in USDC on Base with x402, no API key. Every answer is an ECDSA-signed boolean, verifiable offline via JWKS.',
    logoUrl: 'https://insumermodel.com/images/logo-icon-square.png',
    websiteUrl: 'https://insumermodel.com/ai-agent-verification-api/',
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
