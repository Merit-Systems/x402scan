import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { env } from '@/env';

const errorReportSchema = z.object({
  // Structured fields
  tool: z.string(),
  resource: z.string().optional(),
  summary: z.string(),
  errorMessage: z.string(),
  stack: z.string().optional(),
  fullReport: z.string().optional(),

  // Metadata added by MCP
  walletAddress: z.string(),
  mcpVersion: z.string(),
  reportedAt: z.string(),
});

export type ErrorReport = z.infer<typeof errorReportSchema>;

interface StoredReport extends ErrorReport {
  reportId: string;
  receivedAt: string;
}

function formatReportAsText(report: StoredReport): string {
  const lines: string[] = [
    `ERROR REPORT`,
    `============`,
    ``,
    `Report ID: ${report.reportId}`,
    `Received:  ${report.receivedAt}`,
    ``,
    `SUMMARY`,
    `-------`,
    report.summary,
    ``,
    `DETAILS`,
    `-------`,
    `Tool:        ${report.tool}`,
    report.resource ? `Resource:    ${report.resource}` : '',
    `Wallet:      ${report.walletAddress}`,
    `MCP Version: ${report.mcpVersion}`,
    ``,
    `ERROR`,
    `-----`,
    report.errorMessage,
  ].filter(Boolean);

  if (report.stack) {
    lines.push(``, `STACK TRACE`, `-----------`, report.stack);
  }

  if (report.fullReport) {
    lines.push(``, `FULL REPORT`, `-----------`, report.fullReport);
  }

  return lines.join('\n');
}

async function storeReport(report: StoredReport): Promise<string | null> {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      '[telemetry] BLOB_READ_WRITE_TOKEN not configured, skipping storage'
    );
    return null;
  }

  try {
    const fileName = `telemetry/${report.reportId}.txt`;
    const content = formatReportAsText(report);
    const blob = await put(fileName, content, {
      access: 'public',
      contentType: 'text/plain',
    });
    return blob.url;
  } catch (error) {
    console.error('[telemetry] Failed to store report in blob', { error });
    return null;
  }
}

async function sendDiscordNotification(
  report: StoredReport,
  blobUrl: string | null
): Promise<void> {
  if (!env.DISCORD_TELEMETRY_WEBHOOK_URL) {
    console.warn(
      '[telemetry] DISCORD_TELEMETRY_WEBHOOK_URL not configured, skipping notification'
    );
    return;
  }

  try {
    // Build compact but informative embed
    const lines: string[] = [
      `**Summary:** ${report.summary}`,
      `**Tool:** \`${report.tool}\`${report.resource ? ` → \`${report.resource.slice(0, 60)}${report.resource.length > 60 ? '...' : ''}\`` : ''}`,
      `**Wallet:** \`${report.walletAddress.slice(0, 10)}...\``,
      '',
      '**Error:**',
      `\`\`\`${report.errorMessage.slice(0, 300)}\`\`\``,
    ];

    if (report.stack) {
      lines.push('**Stack:**', `\`\`\`${report.stack.slice(0, 400)}\`\`\``);
    }

    if (blobUrl) {
      lines.push('', `📄 **[View Full Report](${blobUrl})**`);
    }

    const payload = {
      username: 'x402scan MCP Telemetry',
      embeds: [
        {
          title: `🚨 MCP Error`,
          description: lines.join('\n'),
          color: 0xff6b6b,
          timestamp: report.receivedAt,
          footer: { text: report.reportId },
        },
      ],
    };

    const response = await fetch(env.DISCORD_TELEMETRY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[telemetry] Discord webhook failed', {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    console.error('[telemetry] Failed to send Discord notification', { error });
  }
}

export const POST = async (request: NextRequest) => {
  try {
    const body: unknown = await request.json();
    const parsed = errorReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid error report format',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const report = parsed.data;
    const reportId = randomUUID();
    const receivedAt = new Date().toISOString();

    const storedReport: StoredReport = {
      ...report,
      reportId,
      receivedAt,
    };

    console.info('[telemetry] Error report received', {
      reportId,
      tool: report.tool,
      resource: report.resource,
      summary: report.summary,
      walletAddress: report.walletAddress,
    });

    // Store in Vercel Blob first, then send Discord with link
    const blobUrl = await storeReport(storedReport);
    await sendDiscordNotification(storedReport, blobUrl);

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Error report received',
    });
  } catch (error) {
    console.error('[telemetry] Failed to process error report', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process error report',
      },
      { status: 500 }
    );
  }
};
