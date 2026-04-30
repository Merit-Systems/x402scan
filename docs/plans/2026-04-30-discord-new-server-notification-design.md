# Discord New Server Notification Design

## Goal

Send a Discord notification when x402scan registers a brand new server for the first time.

## Trigger

The notification fires after at least one resource registration succeeds for an origin that previously had no registered resources. Single endpoint registration notifies from `registerResource`. Discovery-based bulk registration suppresses per-resource notifications and sends one notification per new origin after the batch has at least one successful resource.

## Payload

Use a Discord webhook with username `🆕 Server`, the x402scan app icon as `avatar_url`, and one embed without an accent color. The embed description shows a linked bold server name followed by the scraped description capped at 60 characters.

## Runtime Behavior

Notifications send only when `VERCEL_ENV=production` and `DISCORD_NOTIFICATIONS_WEBHOOK_URL` is configured. Sending runs through Next's `after()` hook and catches/logs failures, so Discord is fire-and-forget and cannot fail the registration path.
