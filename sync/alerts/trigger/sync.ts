import { logger, schedules } from '@trigger.dev/sdk/v3';
import { checkUSDCBalance } from './balance-checker';
import { sendDiscordAlert } from './discord';
import type { Address } from 'viem';

export const balanceMonitor = schedules.task({
  id: 'balance-monitor',
  cron: '*/5 * * * *',
  run: async () => {
    const addressesString = process.env.MONITOR_ADDRESSES;
    const thresholdString = process.env.MONITOR_THRESHOLD || '10';
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const rpcUrl = process.env.BASE_RPC_URL;

    if (!addressesString) {
      throw new Error('MONITOR_ADDRESSES environment variable is required');
    }

    if (!discordWebhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL environment variable is required');
    }

    const addresses = addressesString
      .split(',')
      .map(addr => addr.trim() as Address);
    const threshold = parseFloat(thresholdString);

    const results = [];
    let alertsSent = 0;

    for (const address of addresses) {
      try {
        const result = await checkUSDCBalance(address, threshold, rpcUrl);
        results.push(result);

        if (result.isLow) {
          await sendDiscordAlert(
            {
              webhookUrl: discordWebhookUrl,
              username: 'x402scan Balance Monitor',
            },
            result
          );

          alertsSent++;
        }
      } catch (error) {
        console.error(`Error checking balance for ${address}:`, error);
      }
    }

    return {
      success: true,
      addressesChecked: addresses.length,
      alertsSent,
      results: results.map(r => ({
        address: r.address,
        balance: r.balance,
        isLow: r.isLow,
      })),
    };
  },
});
