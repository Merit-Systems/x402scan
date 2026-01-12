import {
  TrendingUp,
  Search,
  Coins,
  Brain,
  ChartCandlestick,
} from 'lucide-react';

import type { RouterInputs } from '@/trpc/client';
import type { LucideIcon } from 'lucide-react';
import { ActivityTimeframe } from '@/types/timeframes';

interface MarketplaceCarousel {
  sectionProps: {
    title: string;
    description?: string;
    Icon: LucideIcon;
  };
  input: RouterInputs['public']['sellers']['bazaar']['list'];
  hideCount?: boolean;
}

export const MARKETPLACE_CAROUSELS: MarketplaceCarousel[] = [
  {
    sectionProps: {
      title: 'Most Used',
      description: 'Ranked by number of successful requests',
      Icon: TrendingUp,
    },
    input: {
      timeframe: ActivityTimeframe.OneDay,
      pagination: {
        page_size: 20,
      },
    },
  },
  {
    sectionProps: {
      title: 'Search Servers',
      description: 'Servers that provide resources for searching the web',
      Icon: Search,
    },
    input: {
      timeframe: ActivityTimeframe.OneDay,
      tags: ['Search'],
      pagination: {
        page_size: 20,
      },
    },
  },
  {
    sectionProps: {
      title: 'Crypto Servers',
      description: 'Servers that provide resources for crypto operations',
      Icon: Coins,
    },
    input: {
      timeframe: ActivityTimeframe.OneDay,
      tags: ['Crypto'],
      pagination: {
        page_size: 20,
      },
    },
  },
  {
    sectionProps: {
      title: 'AI Servers',
      description: 'Servers that provide AI resources',
      Icon: Brain,
    },
    input: {
      timeframe: ActivityTimeframe.OneDay,
      tags: ['Utility'],
      pagination: {
        page_size: 20,
      },
    },
  },
  {
    sectionProps: {
      title: 'Trading Servers',
      description: 'Servers that provide resources for trading information',
      Icon: ChartCandlestick,
    },
    input: {
      timeframe: ActivityTimeframe.OneDay,
      tags: ['Trading'],
      pagination: {
        page_size: 20,
      },
    },
  },
];
