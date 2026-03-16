import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { list } from '@vercel/blob';
import { ReportList } from './_components/report-list';

async function listAllBlobs() {
  const allBlobs: { url: string; pathname: string; uploadedAt: string; size: number }[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({ prefix: 'telemetry/', cursor });
    for (const blob of result.blobs) {
      allBlobs.push({
        url: blob.url,
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt.toISOString(),
        size: blob.size,
      });
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return allBlobs;
}

export default async function McpErrorsPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    forbidden();
  }

  const reports = await listAllBlobs();

  return (
    <div>
      <Heading
        title="MCP Errors"
        description="Browse error reports submitted via the MCP report_error tool."
      />
      <Body>
        <ReportList reports={reports} />
      </Body>
    </div>
  );
}
