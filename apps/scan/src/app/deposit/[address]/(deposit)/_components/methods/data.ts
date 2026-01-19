import { OnrampMethods } from '@/services/onramp/types';
import type { LucideIcon } from 'lucide-react';
import { CreditCard, Landmark, Wallet, Gift } from 'lucide-react';

interface MethodMetadata {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const METHOD_METADATA: Record<OnrampMethods, MethodMetadata> = {
  [OnrampMethods.DEBIT_CARD]: {
    label: 'Debit Card',
    icon: CreditCard,
    description: 'Buy USDC with a debit card',
  },
  [OnrampMethods.ACH]: {
    label: 'Bank Account',
    icon: Landmark,
    description: 'Buy USDC with a bank account',
  },
  [OnrampMethods.WALLET]: {
    label: 'Wallet',
    icon: Wallet,
    description: 'Deposit funds directly into your account using your wallet',
  },
  [OnrampMethods.INVITE_CODE]: {
    label: 'Invite Code',
    icon: Gift,
    description: 'Redeem an invite code for free USDC',
  },
};
