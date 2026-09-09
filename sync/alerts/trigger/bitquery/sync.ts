import { idempotencyKeys, logger, schedules, task } from "@trigger.dev/sdk/v3";

import { sendBitqueryUsageAlert } from "./discord";
import { fetchBitqueryUsage, isUsageAtThreshold } from "./fetch-usage";

export const sendBitqueryUsageAlertTask = task({
  id: "send-bitquery-usage-alert",
  run: async () => {
    await sendBitqueryUsageAlert();
  },
});

export const bitqueryUsageMonitor = schedules.task({
  id: "bitquery-usage-monitor",
  cron: "0 * * * *",
  run: async () => {
    const usage = await fetchBitqueryUsage();
    const { points_limit } = usage.billing_period.limits;
    const { points_usage } = usage.billing_period.usage;
    const percentUsed =
      points_limit > 0 ? (points_usage / points_limit) * 100 : 0;

    logger.log("[Bitquery] Usage check", {
      points_usage,
      points_limit,
      percentUsed: percentUsed.toFixed(1),
      periodEnds: usage.billing_period.ended_at,
      status: usage.status,
    });

    if (!isUsageAtThreshold(usage)) {
      logger.log("[Bitquery] Below threshold, skipping alert");
      return;
    }

    const idempotencyKey = await idempotencyKeys.create(
      "bitquery-usage-95pct",
      { scope: "global" }
    );

    await sendBitqueryUsageAlertTask.trigger(undefined, {
      idempotencyKey,
      idempotencyKeyTTL: "1d",
    });
    logger.log("[Bitquery] Alert triggered");
  },
});
