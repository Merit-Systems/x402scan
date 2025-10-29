import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type parseX402Response } from '@/lib/x402/schema';
import { CheckCircle, Minus, XCircle } from 'lucide-react';

type TestResult = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
};

type ParsedPair = {
  result: TestResult;
  parsed: ReturnType<typeof parseX402Response>;
} | null;

type PreviewData = {
  title: string | null;
  description: string | null;
  favicon: string | null;
  ogImages: { url: string | null }[];
  origin: string;
} | null;

export function Checklist({
  preview,
  getPair,
  postPair,
}: {
  preview: PreviewData;
  getPair: ParsedPair;
  postPair: ParsedPair;
}) {
  const g = getPair;
  const p = postPair;

  const analyze = (parsed: ReturnType<typeof parseX402Response>) => {
    if (!parsed?.success)
      return { hasAccepts: false, hasInput: false, hasOutput: false };
    const acc = parsed.data.accepts ?? [];
    const firstAcc = acc[0];
    return {
      hasAccepts: acc.length > 0,
      hasInput: Boolean(firstAcc?.outputSchema?.input),
      hasOutput: firstAcc?.outputSchema?.output !== undefined,
    };
  };
  const gInfo = g?.parsed?.success ? analyze(g.parsed) : undefined;
  const pInfo = p?.parsed?.success ? analyze(p.parsed) : undefined;

  const Icon = ({ ok, message }: { ok?: boolean; message?: string }) =>
    ok === undefined ? (
      <Minus className="size-4 text-muted-foreground" />
    ) : ok ? (
      <CheckCircle className="size-4 text-green-600" />
    ) : message ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <XCircle className="size-4 text-red-600" />
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{message}</TooltipContent>
      </Tooltip>
    ) : (
      <XCircle className="size-4 text-red-600" />
    );

  // Helper to render a row with GET/POST icons
  const Row = ({
    label,
    gOk,
    pOk,
    gMsg,
    pMsg,
  }: {
    label: string;
    gOk?: boolean;
    pOk?: boolean;
    gMsg?: string;
    pMsg?: string;
  }) => (
    <TableRow>
      <TableCell className="pr-2">{label}</TableCell>
      <TableCell className="pr-2">
        <Icon ok={gOk} message={gMsg} />
      </TableCell>
      <TableCell>
        <Icon ok={pOk} message={pMsg} />
      </TableCell>
    </TableRow>
  );

  const joinErrors = (errors?: string[]) =>
    errors?.length ? errors.join('\n') : undefined;

  const buildSchemaMessage = (
    pair: ParsedPair,
    which: 'input' | 'output' | 'both'
  ) => {
    if (!pair?.parsed) return undefined;
    if (pair.parsed.success === false) return joinErrors(pair.parsed.errors);
    const acc = pair.parsed.data.accepts?.[0];
    const hasInput = Boolean(acc?.outputSchema?.input);
    const hasOutput = acc?.outputSchema?.output !== undefined;
    if (which === 'input')
      return hasInput ? undefined : 'Missing outputSchema.input';
    if (which === 'output')
      return hasOutput ? undefined : 'Missing outputSchema.output';
    if (!hasInput && !hasOutput) return 'Missing input and output schemas';
    if (!hasInput) return 'Missing input schema';
    if (!hasOutput) return 'Missing output schema';
    return undefined;
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Checklist</CardTitle>
        <CardDescription>402 validation and metadata</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <Table>
          <TableHeader>
            <TableRow className="text-muted-foreground">
              <TableHead>Check</TableHead>
              <TableHead>GET</TableHead>
              <TableHead>POST</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Section: x402 response */}
            <TableRow>
              <TableCell
                colSpan={3}
                className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground font-medium py-1"
              >
                x402 response
              </TableCell>
            </TableRow>
            <Row
              label="Returns 402"
              gOk={
                g?.result?.status === 402 ? true : g?.result ? false : undefined
              }
              pOk={
                p?.result?.status === 402 ? true : p?.result ? false : undefined
              }
              gMsg={
                g?.result && g.result.status !== 402
                  ? `${g.result.status} ${g.result.statusText}`
                  : undefined
              }
              pMsg={
                p?.result && p.result.status !== 402
                  ? `${p.result.status} ${p.result.statusText}`
                  : undefined
              }
            />
            <Row
              label="x402 parses"
              gOk={
                g?.parsed?.success === true
                  ? true
                  : g?.parsed
                    ? false
                    : undefined
              }
              pOk={
                p?.parsed?.success === true
                  ? true
                  : p?.parsed
                    ? false
                    : undefined
              }
              gMsg={
                g?.parsed?.success === false
                  ? joinErrors(g.parsed.errors)
                  : undefined
              }
              pMsg={
                p?.parsed?.success === false
                  ? joinErrors(p.parsed.errors)
                  : undefined
              }
            />
            {/* Valid schema: collapse if input/output match across GET & POST */}
            {(gInfo?.hasInput ?? undefined) ===
              (gInfo?.hasOutput ?? undefined) &&
            (pInfo?.hasInput ?? undefined) ===
              (pInfo?.hasOutput ?? undefined) ? (
              <Row
                label="Valid schema"
                gOk={gInfo?.hasInput}
                pOk={pInfo?.hasInput}
                gMsg={buildSchemaMessage(g, 'both')}
                pMsg={buildSchemaMessage(p, 'both')}
              />
            ) : (
              <>
                <Row
                  label="Valid input schema"
                  gOk={gInfo?.hasInput}
                  pOk={pInfo?.hasInput}
                  gMsg={buildSchemaMessage(g, 'input')}
                  pMsg={buildSchemaMessage(p, 'input')}
                />
                <Row
                  label="Valid output schema"
                  gOk={gInfo?.hasOutput}
                  pOk={pInfo?.hasOutput}
                  gMsg={buildSchemaMessage(g, 'output')}
                  pMsg={buildSchemaMessage(p, 'output')}
                />
              </>
            )}

            {/* Section: Page metadata */}
            <TableRow>
              <TableCell
                colSpan={3}
                className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground font-medium py-1 border-t"
              >
                page metadata
              </TableCell>
            </TableRow>
            <Row
              label="OG image"
              gOk={!!preview?.ogImages?.[0]?.url}
              pOk={!!preview?.ogImages?.[0]?.url}
            />
            <Row
              label="OG description"
              gOk={!!preview?.description}
              pOk={!!preview?.description}
            />
            <Row
              label="Favicon"
              gOk={!!preview?.favicon}
              pOk={!!preview?.favicon}
            />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
