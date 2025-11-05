import type { BalanceCheckResult, DiscordWebhookConfig } from './types';
import { CURRENCY_CONFIG } from './config';

export async function sendDiscordAlert(
  config: DiscordWebhookConfig,
  balanceResult: BalanceCheckResult
): Promise<void> {
  const { symbol, decimals } = CURRENCY_CONFIG[balanceResult.currency];
  const currencyName = balanceResult.currency;

  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: config.username || 'x402scan Alerts',
      avatar_url: config.avatarUrl,
      embeds: [
        {
          title: `🚨 Low ${currencyName} Balance Alert`,
          description: `Address ${balanceResult.address} has a low ${currencyName} balance on Base.`,
          color: 0xff0000,
          fields: [
            {
              name: 'Address',
              value: `\`${balanceResult.address}\``,
              inline: false,
            },
            {
              name: 'Current Balance',
              value: `${symbol}${parseFloat(balanceResult.balance).toFixed(decimals)} ${currencyName}`,
              inline: true,
            },
            {
              name: 'Threshold',
              value: `${symbol}${balanceResult.threshold.toFixed(decimals)} ${currencyName}`,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'x402scan Balance Monitor' },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Discord webhook failed: ${response.status} ${response.statusText}`
    );
  }
}
