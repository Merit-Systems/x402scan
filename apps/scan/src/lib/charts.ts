import { Chain, CHAIN_LABELS, CHAIN_ICONS } from "@/types/chain";

const NETWORK_COLORS = {
  [Chain.BASE]: "hsl(221, 83%, 53%)",
  [Chain.SOLANA]: "hsl(271, 100%, 71%)",
  [Chain.POLYGON]: "hsl(272, 55%, 50%)",
  [Chain.OPTIMISM]: "hsl(0, 91%, 71%)",
} satisfies Record<Chain, string>;

export const networks = Object.values(Chain).map((chain) => ({
  chain,
  name: CHAIN_LABELS[chain],
  icon: CHAIN_ICONS[chain],
  color: NETWORK_COLORS[chain],
}));
