import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { parseX402Response } from '@/lib/x402/schema';
import type { TestResult } from './checklist';

export function DebugCards({
  getPair,
  postPair,
}: {
  getPair: {
    result: TestResult;
    parsed: ReturnType<typeof parseX402Response>;
  } | null;
  postPair: {
    result: TestResult;
    parsed: ReturnType<typeof parseX402Response>;
  } | null;
}) {
  const analyze = (parsed: ReturnType<typeof parseX402Response>) => {
    if (!parsed || !parsed.success)
      return { hasAccepts: false, hasInput: false };
    const acc = parsed.data.accepts ?? [];
    return {
      hasAccepts: acc.length > 0,
      hasInput: Boolean(acc[0]?.outputSchema?.input),
    };
  };

  return (
    <div className="pl-4 flex flex-col gap-4">
      {getPair && getPair.result.status === 402 && !getPair.parsed.success && (
        <Card className="border-yellow-600/60 bg-yellow-600/5">
          <CardHeader>
            <CardTitle className="text-sm">
              GET returned 402 but schema was invalid
            </CardTitle>
            <CardDescription>
              Fix the x402 response to include a valid accepts/outputSchema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-xs text-muted-foreground">
              {getPair.parsed.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {postPair &&
        postPair.result.status === 402 &&
        !postPair.parsed.success && (
          <Card className="border-yellow-600/60 bg-yellow-600/5">
            <CardHeader>
              <CardTitle className="text-sm">
                POST returned 402 but schema was invalid
              </CardTitle>
              <CardDescription>
                Fix the x402 response to include a valid accepts/outputSchema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-xs text-muted-foreground">
                {postPair.parsed.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {getPair &&
        getPair.result.status === 402 &&
        getPair.parsed.success &&
        (() => {
          const info = analyze(getPair.parsed);
          if (!info.hasAccepts) {
            return (
              <Card className="border-yellow-600/60 bg-yellow-600/5">
                <CardHeader>
                  <CardTitle className="text-sm">
                    GET 402 but no accepts provided
                  </CardTitle>
                  <CardDescription>
                    Add an accepts array to the x402 response.
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          }
          if (!info.hasInput) {
            return (
              <Card className="border-yellow-600/60 bg-yellow-600/5">
                <CardHeader>
                  <CardTitle className="text-sm">
                    GET 402 but missing outputSchema.input
                  </CardTitle>
                  <CardDescription>
                    Provide outputSchema.input to enable in-app invocation.
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          }
          return null;
        })()}

      {postPair &&
        postPair.result.status === 402 &&
        postPair.parsed.success &&
        (() => {
          const info = analyze(postPair.parsed);
          if (!info.hasAccepts) {
            return (
              <Card className="border-yellow-600/60 bg-yellow-600/5">
                <CardHeader>
                  <CardTitle className="text-sm">
                    POST 402 but no accepts provided
                  </CardTitle>
                  <CardDescription>
                    Add an accepts array to the x402 response.
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          }
          if (!info.hasInput) {
            return (
              <Card className="border-yellow-600/60 bg-yellow-600/5">
                <CardHeader>
                  <CardTitle className="text-sm">
                    POST 402 but missing outputSchema.input
                  </CardTitle>
                  <CardDescription>
                    Provide outputSchema.input to enable in-app invocation.
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          }
          return null;
        })()}
    </div>
  );
}
