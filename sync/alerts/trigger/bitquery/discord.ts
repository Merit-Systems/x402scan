const DISCORD_USER_ID = "382656830087757824";
const AVATAR_URL = "https://x402scan.com/manifest/512x512.png";

export async function sendBitqueryUsageAlert(): Promise<void> {
  const webhookUrl = process.env.DISCORD_MERCHANT_HEALTH_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("DISCORD_MERCHANT_HEALTH_WEBHOOK_URL is not configured");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Bitquery Warning",
      content: `5% of points remaining this billing period. <@${DISCORD_USER_ID}>`,
      allowed_mentions: { users: [DISCORD_USER_ID] },
      avatar_url: AVATAR_URL,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Discord webhook failed: ${response.status} ${body.slice(0, 200)}`
    );
  }
}
