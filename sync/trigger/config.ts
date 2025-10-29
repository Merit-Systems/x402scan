import { Chain } from './types';

// Mapping of address -> syncStartDate for each chain
export const SYNC_START_DATES: Record<Chain, Record<string, Date>> = {
  [Chain.BASE]: {
    '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6': new Date('2025-05-05'), // Coinbase
    '0x222c4367a2950f3b53af260e111fc3060b0983ff': new Date('2025-10-05'), // AurraCloud
    '0xb70c4fe126de09bd292fe3d1e40c6d264ca6a52a': new Date('2025-10-27'), // AurraCloud
    '0x80c08de1a05df2bd633cf520754e40fde3c794d3': new Date('2025-10-07'), // thirdweb
    '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec': new Date('2024-12-05'), // X402rs
    '0x76eee8f0acabd6b49f1cc4e9656a0c8892f3332e': new Date('2025-10-26'), // X402rs
    '0x97d38aa5de015245dcca76305b53abe6da25f6a5': new Date('2025-10-24'), // X402rs
    '0x0168f80e035ea68b191faf9bfc12778c87d92008': new Date('2025-10-24'), // X402rs
    '0x5e437bee4321db862ac57085ea5eb97199c0ccc5': new Date('2025-10-24'), // X402rs
    '0xc19829b32324f116ee7f80d193f99e445968499a': new Date('2025-10-26'), // X402rs
    '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63': new Date('2025-05-18'), // PayAI
    '0x279e08f711182c79ba6d09669127a426228a4653': new Date('2025-10-16'), // Daydreams
    '0xfe0920a0a7f0f8a1ec689146c30c3bbef439bf8a': new Date('2025-10-24'), // Mogami
    '0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8': new Date('2025-10-16'), // OpenX402
    '0x97db9b5291a218fc77198c285cefdc943ef74917': new Date('2025-10-16'), // OpenX402
  },
  [Chain.POLYGON]: {
    '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec': new Date('2025-04-01'), // X402rs
  },
  [Chain.SOLANA]: {
    'L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg': new Date('2025-10-24'), // Coinbase
    '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4': new Date('2025-07-01'), // PayAI
    'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU': new Date('2025-09-21'), // Corbits
    'DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV': new Date('2025-10-26'), // Dexter
    'DuQ4jFMmVABWGxabYHFkGzdyeJgS1hp4wrRuCtsJgT9a': new Date('2025-10-16'), // Daydreams
    '5xvht4fYDs99yprfm4UeuHSLxMBRpotfBtUCQqM3oDNG': new Date('2025-10-16'), // OpenX402
  },
};

export function getSyncStartDate(chain: Chain, address: string): Date {
  const normalizedAddress = address.toLowerCase();
  const date = SYNC_START_DATES[chain]?.[normalizedAddress];

  if (!date) {
    throw new Error(
      `Sync start date not found for address ${address} on chain ${chain}`
    );
  }

  return date;
}
