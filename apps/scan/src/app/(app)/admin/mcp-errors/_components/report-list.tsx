'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Report {
  url: string;
  pathname: string;
  uploadedAt: string;
  size: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function filenameFromPath(pathname: string): string {
  return pathname.split('/').pop() ?? pathname;
}

export function ReportList({ reports }: { reports: Report[] }) {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handlePreview(report: Report) {
    setPreviewName(filenameFromPath(report.pathname));
    setPreviewContent(null);
    setLoading(true);

    try {
      const res = await fetch(report.url);
      const text = await res.text();
      setPreviewContent(text);
    } catch {
      setPreviewContent('Failed to load report content.');
    } finally {
      setLoading(false);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No error reports found.</p>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Filename</th>
              <th className="text-left px-4 py-2 font-medium">Uploaded</th>
              <th className="text-left px-4 py-2 font-medium">Size</th>
              <th className="text-right px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.pathname} className="border-b last:border-b-0">
                <td className="px-4 py-2 font-mono text-xs truncate max-w-[300px]">
                  {filenameFromPath(report.pathname)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatDistanceToNow(new Date(report.uploadedAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatBytes(report.size)}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(report)}
                  >
                    Preview
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={previewContent !== null || loading}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewContent(null);
            setLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {previewName}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 rounded-md p-4">
                {previewContent}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
