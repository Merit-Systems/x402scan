import type { BalanceCheckResult, DiscordWebhookConfig } from './types';
import { CURRENCY_CONFIG } from './config';

export async function sendDiscordAlert(
  balanceResult: BalanceCheckResult
): Promise<void> {
  const { symbol, decimalsExternal } = CURRENCY_CONFIG[balanceResult.currency];
  const currencyName = balanceResult.currency;

  const response = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'x402scan Balance Monitor',
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
              value: `${symbol}${parseFloat(balanceResult.balance).toFixed(decimalsExternal)} ${currencyName}`,
              inline: true,
            },
            {
              name: 'Threshold',
              value: `${symbol}${balanceResult.threshold.toFixed(decimalsExternal)} ${currencyName}`,
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
