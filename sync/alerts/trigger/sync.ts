import { logger, schedules } from '@trigger.dev/sdk/v3';
import { sendDiscordAlert } from './discord';
import { BALANCE_MONITORS, CURRENCY_TO_BALANCE_CHECKER } from './config';

export const balanceMonitor = schedules.task({
  id: 'balance-monitor',
  cron: '*/5 * * * *',
  run: async () => {
    for (const monitor of BALANCE_MONITORS) {
      const balanceChecker = CURRENCY_TO_BALANCE_CHECKER[monitor.currency](
        monitor.address,
        monitor.threshold
      );
      const result = await balanceChecker;
      if (result.isLow) {
        await sendDiscordAlert(result);
      }
    }
  },
});
