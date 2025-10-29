import {
  Network,
  Facilitator,
  FacilitatorConfig,
  FacilitatorConfigConstructor,
} from '../types';
import { USDC_BASE_TOKEN } from '../constants';

interface AurraCloudProps {
  apiKey: string;
}

export const aurracloud: FacilitatorConfigConstructor<AurraCloudProps> = ({
  apiKey,
}) => ({
  url: `https://x402-facilitator.aurracloud.com/api/v1/${apiKey}`,
});

export const aurracloudDiscovery: FacilitatorConfig = {
  url: 'https://x402-facilitator.aurracloud.com',
};

export const aurracloudFacilitator = {
  id: 'aurracloud',
  metadata: {
    name: 'AurraCloud',
    image: 'https://x402scan.com/aurracloud.png',
    docsUrl: 'https://x402-facilitator.aurracloud.com',
    color: 'var(--color-gray-600)',
  },
  config: aurracloud,
  discoveryConfig: aurracloudDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x222c4367a2950f3b53af260e111fc3060b0983ff',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-05'),
      },
      {
        address: '0xb70c4fe126de09bd292fe3d1e40c6d264ca6a52a',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-27'),
      },
    ],
  },
} as const satisfies Facilitator<AurraCloudProps>;
