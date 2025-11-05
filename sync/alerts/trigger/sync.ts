import { logger, schedules } from '@trigger.dev/sdk/v3';
import { sendDiscordAlert } from './discord';
import { ADDRESSES_CONFIG, CURRENCY_TO_BALANCE_CHECKER } from './config';

export const balanceMonitor = schedules.task({
  id: 'balance-monitor',
  cron: '*/5 * * * *',
  run: async () => {
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL!;
    const rpcUrl = process.env.BASE_RPC_URL!;

    for (const config of ADDRESSES_CONFIG) {
      try {
        const balanceChecker = CURRENCY_TO_BALANCE_CHECKER[config.currency];
        const result = await balanceChecker(
          config.address,
          config.threshold,
          rpcUrl
        );

        if (result.isLow) {
          await sendDiscordAlert(
            {
              webhookUrl: discordWebhookUrl,
              username: 'x402scan Balance Monitor',
            },
            result
          );
        }
      } catch (error) {
        logger.error(`Error checking balance for ${config.address}:`, error);
      }
    }
  },
});
