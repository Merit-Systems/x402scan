import type { BalanceCheckResult, DiscordWebhookConfig } from './types';

export async function sendDiscordAlert(
  config: DiscordWebhookConfig,
  balanceResult: BalanceCheckResult
): Promise<void> {
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: config.username || 'x402scan Alerts',
      avatar_url: config.avatarUrl,
      embeds: [
        {
          title: '🚨 Low USDC Balance Alert',
          description: `Address ${balanceResult.address} has a low USDC balance on Base.`,
          color: 0xff0000,
          fields: [
            {
              name: 'Address',
              value: `\`${balanceResult.address}\``,
              inline: false,
            },
            {
              name: 'Current Balance',
              value: `$${parseFloat(balanceResult.balance).toFixed(2)} USDC`,
              inline: true,
            },
            {
              name: 'Threshold',
              value: `$${balanceResult.threshold.toFixed(2)} USDC`,
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
