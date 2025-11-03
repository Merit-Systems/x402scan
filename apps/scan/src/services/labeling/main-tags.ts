export const MAIN_TAGS = {
  Search: 'Any tool which retrieves information.',
  AI: 'Any tool which offers an AI chat service or agent functionality.',
  Crypto: 'Any tool related to minting tokens or other crypto assets.',
  Trading: 'Any tool related to trading or swapping assets.',
  Utility:
    'Any tool which performs a utility function, such as running code or performing a service. Utility would include memory, cache store, fetching the weather, etc.',
  Random:
    'Any tool which does something lighthearted or fun, such as a joke or a meme generator.',
} as const;

export type MainTag = keyof typeof MAIN_TAGS;
