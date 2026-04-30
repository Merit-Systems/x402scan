import 'server-only';

import { after } from 'next/server';

import { env } from '@/env';

const NEW_SERVER_USERNAME = '🆕 Server';

interface NewServerNotification {
  originId: string;
  origin: string;
  title: string | null;
  description: string | null;
}

interface DiscordConfig {
  webhookUrl: string;
  appUrl: string;
}

export function notifyNewServer(notification: NewServerNotification) {
  scheduleDiscordNotification({
    username: NEW_SERVER_USERNAME,
    embed: config => buildNewServerEmbed(notification, config),
  });
}

function scheduleDiscordNotification(options: {
  username: string;
  embed: (config: DiscordConfig) => DiscordEmbed;
}) {
  try {
    const config = getDiscordConfig();
    if (!config) return;

    after(async () => {
      try {
        await postDiscordWebhook(config.webhookUrl, {
          username: options.username,
          avatar_url: `${config.appUrl}/manifest/512x512.png`,
          embeds: [options.embed(config)],
        });
      } catch (error) {
        logNotificationError(error, options.username);
      }
    });
  } catch (error) {
    logNotificationError(error, options.username);
  }
}

function getDiscordConfig(): DiscordConfig | null {
  const webhookUrl = env.DISCORD_NOTIFICATIONS_WEBHOOK_URL;

  if (process.env.VERCEL_ENV !== 'production' || !webhookUrl) return null;

  return {
    webhookUrl,
    appUrl: env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, ''),
  };
}

async function postDiscordWebhook(
  webhookUrl: string,
  payload: {
    username: string;
    avatar_url: string;
    embeds: DiscordEmbed[];
  }
) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Discord webhook failed with ${response.status}: ${body.slice(0, 200)}`
    );
  }
}

interface DiscordEmbed {
  description: string;
}

function buildNewServerEmbed(
  notification: NewServerNotification,
  config: DiscordConfig
) {
  const domain = domainFromOrigin(notification.origin);
  const title = notification.title?.trim();
  const name = title && title.length > 0 ? title : domain;
  const description = truncateDescription(notification.description);
  const lines = [
    `[**${escapeMarkdown(name)}**](${serverUrl(config.appUrl, notification.originId)})`,
  ];

  if (description) {
    lines.push(escapeMarkdown(description));
  }

  return {
    description: lines.join('\n'),
  };
}

function serverUrl(appUrl: string, originId: string) {
  return `${appUrl}/server/${encodeURIComponent(originId)}`;
}

function truncateDescription(description: string | null) {
  const trimmed = description?.trim();
  if (!trimmed) return null;

  return trimmed.length <= 60 ? trimmed : `${trimmed.slice(0, 57)}...`;
}

function domainFromOrigin(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

function logNotificationError(error: unknown, username: string) {
  console.error('[discord-notifications] failed to send notification', {
    error: error instanceof Error ? error.message : String(error),
    username,
  });
}

function escapeMarkdown(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('*', '\\*')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}
