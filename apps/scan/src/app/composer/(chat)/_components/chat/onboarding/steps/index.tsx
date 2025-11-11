import {
  Bot,
  CheckCircle,
  DollarSign,
  MessagesSquare,
  Server,
} from 'lucide-react';

import { WalletStep } from './3_wallet';
import { ResourcesStep } from './2_resources';
import { FundStep } from './4_fund';

import type { OnboardingStep } from './types';
import { AcknowledgeStep } from './5_acknowledge';
import { IntroductionStep } from './1_introduction';

export const steps: OnboardingStep[] = [
  {
    icon: <MessagesSquare className="size-4" />,
    component: <IntroductionStep />,
    heading: 'Composer is an x402 Agent Playground',
    description: 'You can invoke any x402 resource with any AI model',
  },
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
    heading: 'Your Composer Wallet Needs USDC to Pay for Resources',
    description:
      'You can send USDC from your connected wallet or onramp with Coinbase',
  },
  {
    icon: <CheckCircle className="size-4" />,
    component: <AcknowledgeStep />,
    heading: 'Composer is an Experimental Project',
    description: 'Please review the following before continuing:',
  },
];
