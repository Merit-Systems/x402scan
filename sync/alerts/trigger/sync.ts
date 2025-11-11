import { logger, schedules } from '@trigger.dev/sdk/v3';
import { sendDiscordAlert } from './discord';
import { BALANCE_MONITORS, CURRENCY_TO_BALANCE_CHECKER } from './config';

export const balanceMonitor = schedules.task({
  id: 'balance-monitor',
  cron: '0 * * * *',
  run: async () => {
    for (const monitor of BALANCE_MONITORS) {
      const monitorId = monitor.address + ':' + monitor.chain.id;
      logger.log(`[Checking] ${monitorId}`);
      const result = await CURRENCY_TO_BALANCE_CHECKER[monitor.currency](
        monitor.address,
        monitor.threshold
      );
      logger.log(`[Balance] ${monitorId}: ${result.balance}`);
      if (result.isLow) {
        await sendDiscordAlert(result);
        logger.log(`[Alert] sent for ${monitorId}`);
      }
    }
  },
});
