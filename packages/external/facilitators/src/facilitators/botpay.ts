import { createHash, createHmac } from 'node:crypto';

import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfigConstructor } from '../types';

interface BotPayProps {
  apiKey: string;
  apiSecret: string;
}

function createBotPayAuthHeaders(
  apiKey: string,
  apiSecret: string,
  path: '/verify' | '/settle'
) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}\nPOST\n${path}`;
  const hashedSecret = createHash('sha256').update(apiSecret).digest();
  const signature = createHmac('sha256', hashedSecret)
    .update(message)
    .digest('hex');

  return {
    'X-API-Key': apiKey,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };
}

export const botpay: FacilitatorConfigConstructor<BotPayProps> = ({
  apiKey,
  apiSecret,
}) => ({
  url: 'https://facilitator.botpay.network',
  createAuthHeaders: async () => ({
    verify: createBotPayAuthHeaders(apiKey, apiSecret, '/verify'),
    settle: createBotPayAuthHeaders(apiKey, apiSecret, '/settle'),
    supported: {},
  }),
});

export const botpayFacilitator = {
  id: 'botpay',
  metadata: {
    name: 'BotPay',
    image: 'https://x402scan.com/botpay.png',
    docsUrl: 'https://facilitator.botpay.network/docs',
    color: '#3F96FF',
  },
  config: botpay,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x4af9c96576d17bbd37e17814c040ebc73c12c956',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-15'),
      },
    ],
  },
} as const satisfies Facilitator<BotPayProps>;
