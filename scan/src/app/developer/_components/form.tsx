'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { ChevronDown, Eye, Plus, X } from 'lucide-react';

import z from 'zod';

import { ResourceExecutor } from '@/app/_components/resources/executor';
import { OriginCard } from '@/app/_components/resources/origin';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ParsedX402Response } from '@/lib/x402/schema';
import { parseX402Response } from '@/lib/x402/schema';
import { Methods } from '@/types/x402';

type TestResult = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
};

type PreviewData = {
  title: string | null;
  description: string | null;
  favicon: string | null;
  ogImages: { url: string | null }[];
  origin: string;
} | null;

export const TestEndpointForm = () => {
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([]);
  const [hasTested, setHasTested] = useState(false);
  const [preview, setPreview] = useState<PreviewData>(null);
  const [parsedResources, setParsedResources] = useState<
    { method: Methods; data: ParsedX402Response }[]
  >([]);
  const [lastGet, setLastGet] = useState<{
    result: TestResult;
    parsed: ReturnType<typeof parseX402Response>;
  } | null>(null);
  const [lastPost, setLastPost] = useState<{
    result: TestResult;
    parsed: ReturnType<typeof parseX402Response>;
  } | null>(null);

  const analyzeParsed = (
    parsed: ReturnType<typeof parseX402Response>
  ): { hasAccepts: boolean; hasInputSchema: boolean } => {
    if (!parsed || !parsed.success)
      return { hasAccepts: false, hasInputSchema: false };
    const accepts = parsed.data.accepts ?? [];
    const hasAccepts = accepts.length > 0;
    const hasInputSchema = Boolean(accepts[0]?.outputSchema?.input);
    return { hasAccepts, hasInputSchema };
  };

  const isValidUrl = useMemo(
    () => z.string().url().safeParse(url).success,
    [url]
  );

  const headersInit: HeadersInit = useMemo(
    () =>
      Object.fromEntries(
        headers
          .filter(h => h.name.trim().length > 0)
          .map(h => [h.name.trim(), h.value])
      ),
    [headers]
  );

  const getQuery = useQuery<{ result: TestResult } | null>({
    queryKey: ['developer-test', 'GET', url, headersInit],
    enabled: false,
    queryFn: async ({ signal }) => {
      const proxied = `/api/proxy?url=${encodeURIComponent(url)}&share_data=true&dev=true`;
      const response = await fetch(proxied, {
        method: 'GET',
        headers: headersInit,
        mode: 'cors',
        redirect: 'follow',
        signal,
      });
      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      const hdrs: Record<string, string> = {};
      response.headers.forEach((v, k) => (hdrs[k] = v));
      return {
        result: {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: hdrs,
          body,
        },
      };
    },
  });

  const postQuery = useQuery<{ result: TestResult } | null>({
    queryKey: ['developer-test', 'POST', url, headersInit],
    enabled: false,
    queryFn: async ({ signal }) => {
      const proxied = `/api/proxy?url=${encodeURIComponent(url)}&share_data=false&dev=true`;
      const response = await fetch(proxied, {
        method: 'POST',
        headers: { ...headersInit, 'Content-Type': 'application/json' },
        body: '{}',
        mode: 'cors',
        redirect: 'follow',
        signal,
      });
      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      const hdrs: Record<string, string> = {};
      response.headers.forEach((v, k) => (hdrs[k] = v));
      return {
        result: {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: hdrs,
          body,
        },
      };
    },
  });

  const previewQuery = useQuery<{ success: boolean; data?: any }>({
    queryKey: ['developer-preview', url],
    enabled: false,
    queryFn: async () => {
      const resp = await fetch(
        `/api/developer/preview?url=${encodeURIComponent(url)}`
      );
      return resp.json();
    },
  });

  // No reset state; keep inputs visible and results below

  const onTest = async () => {
    if (!isValidUrl) return;
    setHasTested(true);
    setParsedResources([]);
    const [getR, postR, prevR] = await Promise.all([
      getQuery.refetch(),
      postQuery.refetch(),
      previewQuery.refetch(),
    ]);

    // Build parsed resources from refetch results
    const found: { method: Methods; data: ParsedX402Response }[] = [];
    const getBody = getR.data?.result?.body;
    const postBody = postR.data?.result?.body;
    const getParsed = parseX402Response(getBody);
    const postParsed = parseX402Response(postBody);
    setLastGet(
      getR.data ? { result: getR.data.result, parsed: getParsed } : null
    );
    setLastPost(
      postR.data ? { result: postR.data.result, parsed: postParsed } : null
    );
    const getInfo = analyzeParsed(getParsed);
    const postInfo = analyzeParsed(postParsed);

    if (getParsed.success && getInfo.hasInputSchema) {
      found.push({ method: Methods.GET, data: getParsed.data });
    }
    if (postParsed.success && postInfo.hasInputSchema) {
      found.push({ method: Methods.POST, data: postParsed.data });
    }
    setParsedResources(found);

    // Set preview from query
    if (prevR.data?.success) {
      const og = prevR.data.data?.og ?? {};
      const metadata = prevR.data.data?.metadata ?? {};
      const originStr: string = prevR.data.data?.origin ?? new URL(url).origin;
      setPreview({
        title: metadata.title ?? og.ogTitle ?? null,
        description: metadata.description ?? og.ogDescription ?? null,
        favicon: og.favicon
          ? og.favicon.startsWith('/')
            ? originStr.replace(/\/$/, '') + og.favicon
            : og.favicon
          : null,
        ogImages: og.ogImage ?? [],
        origin: originStr,
      });
    } else {
      setPreview(null);
    }
  };

  return (
    <>
      {/* Collapsible schema reference */}
      {/* <div className="mt-2">
        <OutputSchemaCard collapsible />
      </div> */}
      <Card>
        <CardHeader>
          <CardTitle>Test Endpoint</CardTitle>
          <CardDescription>
            Provide an endpoint URL to test directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label>Endpoint URL</Label>
              <Input
                type="text"
                placeholder="https://"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="size-fit p-0 w-full md:size-fit text-xs md:text-xs text-muted-foreground/60 hover:text-muted-foreground"
                >
                  Advanced Configuration
                  <ChevronDown className="size-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border p-4 rounded-md">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Headers</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        setHeaders([...headers, { name: '', value: '' }])
                      }
                      className="size-fit px-1 md:size-fit"
                    >
                      <Plus className="size-3" />
                      Add Header
                    </Button>
                  </div>
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-1 items-center">
                      <Input
                        type="text"
                        placeholder="Name"
                        value={header.name}
                        onChange={e =>
                          setHeaders(
                            headers.map((h, i) =>
                              i === index ? { ...h, name: e.target.value } : h
                            )
                          )
                        }
                      />
                      <Input
                        type="text"
                        placeholder="Value"
                        value={header.value}
                        onChange={e =>
                          setHeaders(
                            headers.map((h, i) =>
                              i === index ? { ...h, value: e.target.value } : h
                            )
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setHeaders(headers.filter((_, i) => i !== index))
                        }
                        className="shrink-0 size-fit p-0 w-full md:size-fit text-xs md:text-xs text-muted-foreground/60 hover:text-muted-foreground"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="turbo"
            disabled={
              getQuery.isFetching || postQuery.isFetching || !isValidUrl
            }
            onClick={onTest}
            className="w-full"
          >
            {getQuery.isFetching || postQuery.isFetching
              ? 'Testing...'
              : 'Test Endpoint'}
          </Button>
        </CardFooter>
      </Card>

      {preview && (
        <div className="mt-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="dev-origin" className="border-b-0">
              <AccordionTrigger asChild>
                <button className="w-full text-left">
                  <OriginCard
                    origin={
                      {
                        id: 'dev',
                        origin: preview.origin,
                        title: preview.title,
                        description: preview.description,
                        favicon: preview.favicon,
                        ogImages: (preview.ogImages ?? []).map(img => ({
                          id: 'dev',
                          url: img?.url ?? '',
                          title: preview.title,
                          description: preview.description,
                          width: null as unknown as number,
                          height: null as unknown as number,
                          originId: 'dev',
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        })),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      } as any
                    }
                    numResources={parsedResources.length}
                  />
                </button>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                {parsedResources.length > 0 && (
                  <div className="pl-4">
                    <Accordion type="multiple" className="border-b-0">
                      {parsedResources.map((entry, idx) => (
                        <ResourceExecutor
                          key={idx}
                          resource={{ id: `dev-${idx}`, resource: url } as unknown as any}
                          tags={[]}
                          response={entry.data}
                          bazaarMethod={
                            (entry.data.accepts?.[0]?.outputSchema?.input.method?.toUpperCase?.() as Methods) ||
                            entry.method
                          }
                          hideOrigin
                          isFlat
                        />
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* Hierarchical 'No resources' notice when both requests finished without 402 */}
                {parsedResources.length === 0 &&
                  hasTested &&
                  !getQuery.isFetching &&
                  !postQuery.isFetching &&
                  lastGet?.result.status !== 402 &&
                  lastPost?.result.status !== 402 && (
                    <div className="pl-4">
                      <Card className="mt-4 border-yellow-600/60">
                        <CardHeader>
                          <CardTitle className="text-sm">No x402 resources found at this path</CardTitle>
                          <CardDescription>Showing debug responses for GET and POST.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {lastGet && (
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="font-medium">GET {url}</div>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="size-3" /> View Body
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>GET Response Body</DialogTitle>
                                      <DialogDescription>Raw response.</DialogDescription>
                                    </DialogHeader>
                                    <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded-md max-h-72 overflow-auto">
                                      {typeof lastGet.result.body === 'string'
                                        ? lastGet.result.body
                                        : JSON.stringify(lastGet.result.body, null, 2)}
                                    </pre>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-3 rounded-md max-h-60 overflow-auto mt-2">
                                {JSON.stringify(lastGet.result.headers, null, 2)}
                              </pre>
                            </div>
                          )}
                          {lastPost && (
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="font-medium">POST {url}</div>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="size-3" /> View Body
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>POST Response Body</DialogTitle>
                                      <DialogDescription>Raw response.</DialogDescription>
                                    </DialogHeader>
                                    <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded-md max-h-72 overflow-auto">
                                      {typeof lastPost.result.body === 'string'
                                        ? lastPost.result.body
                                        : JSON.stringify(lastPost.result.body, null, 2)}
                                    </pre>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-3 rounded-md max-h-60 overflow-auto mt-2">
                                {JSON.stringify(lastPost.result.headers, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                {/* Show schema errors when upstream returned 402 but parsing failed */}
                <div className="pl-4 flex flex-col gap-4">
                  {lastGet &&
                    lastGet.result.status === 402 &&
                    !lastGet.parsed.success && (
                      <Card className="border-yellow-600/60 bg-yellow-600/5">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            GET returned 402 but schema was invalid
                          </CardTitle>
                          <CardDescription>
                            Fix the x402 response to include a valid
                            accepts/outputSchema.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-xs text-muted-foreground">
                            {lastGet.parsed.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  {lastPost &&
                    lastPost.result.status === 402 &&
                    !lastPost.parsed.success && (
                      <Card className="border-yellow-600/60 bg-yellow-600/5">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            POST returned 402 but schema was invalid
                          </CardTitle>
                          <CardDescription>
                            Fix the x402 response to include a valid
                            accepts/outputSchema.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-xs text-muted-foreground">
                            {lastPost.parsed.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                  {/* No-accepts / no-outputSchema debugging */}
                  {lastGet &&
                    lastGet.result.status === 402 &&
                    lastGet.parsed.success &&
                    (() => {
                      const info = analyzeParsed(lastGet.parsed);
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
                      if (!info.hasInputSchema) {
                        return (
                          <Card className="border-yellow-600/60 bg-yellow-600/5">
                            <CardHeader>
                              <CardTitle className="text-sm">
                                GET 402 but missing outputSchema.input
                              </CardTitle>
                              <CardDescription>
                                Provide outputSchema.input to enable in-app
                                invocation.
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        );
                      }
                      return null;
                    })()}
                  {lastPost &&
                    lastPost.result.status === 402 &&
                    lastPost.parsed.success &&
                    (() => {
                      const info = analyzeParsed(lastPost.parsed);
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
                      if (!info.hasInputSchema) {
                        return (
                          <Card className="border-yellow-600/60 bg-yellow-600/5">
                            <CardHeader>
                              <CardTitle className="text-sm">
                                POST 402 but missing outputSchema.input
                              </CardTitle>
                              <CardDescription>
                                Provide outputSchema.input to enable in-app
                                invocation.
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        );
                      }
                      return null;
                    })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Resource executors are rendered inside the accordion above */}

      {/* Bottom-level warning removed; now rendered within origin panel */}
    </>
  );
};
