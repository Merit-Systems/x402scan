import { Bot, CheckCircle, DollarSign, HandCoins, Server } from 'lucide-react';

import { WalletStep } from './1_wallet';
import { ResourcesStep } from './2_resources';
import { SponsorStep } from './3_sponsor';
import { FundStep } from './4_fund';

import type { OnboardingStep } from './types';
import { AcknowledgeStep } from './5_acknowledge';

export const steps: OnboardingStep[] = [
  {
    icon: <Bot className="size-4" />,
    component: <WalletStep />,
    heading: 'Your Account has a Composer Wallet',
    description:
      'You interact with x402 resources on the Composer through a secure server wallet owned by your account',
  },
  {
    icon: <Server className="size-4" />,
    component: <ResourcesStep />,
    heading: 'Your Composer Wallet Pays for x402 Resources',
    description:
      'All LLM and x402 resource requests are paid for by your Composer Wallet.',
  },
  {
    icon: <DollarSign className="size-4" />,
    component: <FundStep />,
    heading: 'You Need to Add USDC to Your Composer Wallet',
    description:
      "After you've used your free credits, you will need to add USDC to your Composer Wallet",
  },
  {
    icon: <CheckCircle className="size-4" />,
    component: <AcknowledgeStep />,
    heading: 'Composer is an Experimental Project',
    description: 'Please review the following before continuing:',
  },
];
