import { Body, Heading } from '@/app/_components/layout/page-utils';
import { auth } from '@/auth';
import { forbidden } from 'next/navigation';
import { list } from '@vercel/blob';
import { ReportList } from './_components/report-list';

export default async function TelemetryPage() {
  const session = await auth();

  if (session?.user.role !== 'admin') {
    forbidden();
  }

  const { blobs } = await list({ prefix: 'telemetry/' });

  const reports = blobs.map((blob) => ({
    url: blob.url,
    pathname: blob.pathname,
    uploadedAt: blob.uploadedAt.toISOString(),
    size: blob.size,
  }));

  return (
    <div>
      <Heading
        title="Telemetry"
        description="Browse error reports submitted via the MCP report_error tool."
      />
      <Body>
        <ReportList reports={reports} />
      </Body>
    </div>
  );
}
