// ============================================================================
// SUBCATEGORIES
// ============================================================================

export interface Subcategory {
  name: string;
  description: string;
}

export const SUBCATEGORIES = {
  Search: [
    {
      name: 'Web Search',
      description: 'Tools that search and retrieve information from the web',
    },
    {
      name: 'Web Extraction',
      description: 'Tools that extract and scrape data from websites',
    },
    {
      name: 'Data/Database Search',
      description: 'Tools that search through databases and structured data',
    },
    {
      name: 'Code/Documentation Search',
      description: 'Tools that search code repositories and technical documentation',
    },
    {
      name: 'News/Content Search',
      description: 'Tools that search for news articles and content',
    },
  ],
  AI: [
    {
      name: 'Chat/Conversational AI',
      description: 'AI tools focused on natural language conversation and dialogue',
    },
    {
      name: 'Image Generation',
      description: 'AI tools that create, generate, or modify images',
    },
    {
      name: 'Code Assistant',
      description: 'AI tools that help with writing, reviewing, or understanding code',
    },
    {
      name: 'Text Analysis/Processing',
      description: 'AI tools that analyze, process, or transform text content',
    },
    {
      name: 'Agent/Automation',
      description: 'AI agents that perform autonomous tasks or workflow automation',
    },
  ],
  Crypto: [
    {
      name: 'MEME COINS',
      description: 'Tools related to meme coins and community-driven tokens',
    },
    {
      name: 'NFT/Collectibles',
      description: 'Tools for creating, trading, or managing NFTs and digital collectibles',
    },
    {
      name: 'DeFi/Staking',
      description: 'Decentralized finance tools for staking, lending, and yield farming',
    },
    {
      name: 'Token Creation/Minting',
      description: 'Tools for creating, deploying, or minting new tokens',
    },
    {
      name: 'Wallet/Portfolio',
      description: 'Tools for managing crypto wallets and tracking portfolio balances',
    },
  ],
  Trading: [
    {
      name: 'DEX/Swapping',
      description: 'Decentralized exchange tools for swapping tokens and assets',
    },
    {
      name: 'Price Tracking',
      description: 'Tools that track and display asset prices and market data',
    },
    {
      name: 'Trading Bots',
      description: 'Automated trading bots and algorithmic trading tools',
    },
    {
      name: 'Portfolio Management',
      description: 'Tools for managing and optimizing trading portfolios',
    },
    {
      name: 'Market Analytics',
      description: 'Tools that provide market analysis, charts, and trading signals',
    },
  ],
  Utility: [
    {
      name: 'Code Execution',
      description: 'Tools that execute code, run scripts, or perform computations',
    },
    {
      name: 'Data Storage/Cache',
      description: 'Tools for storing, caching, or managing data and memory',
    },
    {
      name: 'API/Integration',
      description: 'Tools that provide API access or integrate with external services',
    },
    {
      name: 'Weather/Location',
      description: 'Tools that provide weather information or location-based services',
    },
    {
      name: 'Conversion/Formatting',
      description: 'Tools that convert or format data between different types',
    },
  ],
  Random: [
    {
      name: 'Jokes/Humor',
      description: 'Tools that generate jokes, puns, or humorous content',
    },
    {
      name: 'Games',
      description: 'Tools that provide interactive games or gaming functionality',
    },
    {
      name: 'Meme Generation',
      description: 'Tools that create or generate memes and funny images',
    },
    {
      name: 'Entertainment',
      description: 'Tools for general entertainment and fun activities',
    },
    {
      name: 'Social/Fun',
      description: 'Tools for social interactions and lighthearted fun',
    },
  ],
} as const;
