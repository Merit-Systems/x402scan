import { DollarSign, Pen, Wallet } from 'lucide-react';

import { Verify } from './verify';

import type { WelcomeStep } from './types';
import { FundWallet } from './fund-wallet';

export const welcomeSteps: WelcomeStep[] = [
  {
    icon: <Wallet className="size-4" />,
    title: 'Connect Wallet',
    component: null,
  },
  {
    icon: <Pen className="size-4" />,
    title: 'Verify Wallet',
    component: <Verify />,
  },
  {
    icon: <DollarSign className="size-4" />,
    title: 'Fund Agent',
    component: <FundWallet />,
  },
];
