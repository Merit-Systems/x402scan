'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { ChevronDown, Plus, X } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ParsedX402Response } from '@/lib/x402/schema';
import { Methods } from '@/types/x402';
import { Checklist } from './checklist';
import { DebugCards } from './debug-cards';
import { usePreviewQuery, useTestQuery, type PreviewData } from './queries';

export const TestEndpointForm = () => {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([]);
  const [submittedUrl, setSubmittedUrl] = useState<string>('');
  const [submittedHeaders, setSubmittedHeaders] = useState<
    { name: string; value: string }[]
  >([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isValidUrl = useMemo(
    () => z.string().url().safeParse(url).success,
    [url]
  );

  const submittedHeadersInit: HeadersInit = useMemo(
    () =>
      Object.fromEntries(
        submittedHeaders
          .filter(h => h.name.trim().length > 0)
          .map(h => [h.name.trim(), h.value])
      ),
    [submittedHeaders]
  );

  const getQuery = useTestQuery('GET', submittedUrl, submittedHeadersInit);
  const postQuery = useTestQuery('POST', submittedUrl, submittedHeadersInit);
  const previewQuery = usePreviewQuery(submittedUrl);

  const onTest = async () => {
    if (!isValidUrl) return;
    // Cancel any in-flight queries to avoid stale updates
    await queryClient.cancelQueries({
      predicate: q =>
        Array.isArray(q.queryKey) &&
        (q.queryKey[0] === 'developer-test' ||
          q.queryKey[0] === 'developer-preview'),
    });
    // Commit current inputs to submitted state so queries use stable keys
    setSubmittedUrl(url);
    setSubmittedHeaders(headers);
    setHasSubmitted(true);
    void getQuery.refetch();
    void postQuery.refetch();
    void previewQuery.refetch();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void onTest();
  };

  // Derived UI state
  const hasTested =
    hasSubmitted &&
    (getQuery.isFetched || postQuery.isFetched || previewQuery.isFetched);
  const getPair = useMemo(
    () =>
      getQuery.data
        ? { result: getQuery.data.result, parsed: getQuery.data.parsed }
        : null,
    [getQuery.data]
  );
  const postPair = useMemo(
    () =>
      postQuery.data
        ? { result: postQuery.data.result, parsed: postQuery.data.parsed }
        : null,
    [postQuery.data]
  );
  const parsedResources = useMemo(() => {
    const list: { method: Methods; data: ParsedX402Response }[] = [];
    if (getQuery.data?.parsed.success && getQuery.data.info.hasInputSchema) {
      list.push({ method: Methods.GET, data: getQuery.data.parsed.data });
    }
    if (postQuery.data?.parsed.success && postQuery.data.info.hasInputSchema) {
      list.push({ method: Methods.POST, data: postQuery.data.parsed.data });
    }
    return list;
  }, [getQuery.data, postQuery.data]);
  const preview: PreviewData = previewQuery.data?.preview ?? null;

  // No persistence; show nothing while fetching

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Endpoint</CardTitle>
          <CardDescription>
            Provide an endpoint URL to test directly
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
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
                                i === index
                                  ? { ...h, value: e.target.value }
                                  : h
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
              type="submit"
              variant="turbo"
              disabled={
                getQuery.isFetching || postQuery.isFetching || !isValidUrl
              }
              className="w-full"
            >
              {getQuery.isFetching || postQuery.isFetching
                ? 'Testing...'
                : 'Test Endpoint'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {hasTested && (
        <Checklist preview={preview} getPair={getPair} postPair={postPair} />
      )}

      {!getQuery.isFetching &&
        !postQuery.isFetching &&
        parsedResources.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-semibold text-foreground">
                Resource Preview
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                This is what your resource will look like on x402scan.
              </p>
            </div>
            <Accordion type="single" collapsible defaultValue="dev-origin">
              <AccordionItem value="dev-origin" className="border-b-0">
                <AccordionTrigger asChild>
                  <button className="w-full text-left">
                    <OriginCard
                      origin={
                        {
                          id: 'dev',
                          origin:
                            preview?.origin ??
                            (() => {
                              try {
                                return new URL(submittedUrl).origin;
                              } catch {
                                return '';
                              }
                            })(),
                          title: preview?.title ?? null,
                          description: preview?.description ?? null,
                          favicon: preview?.favicon ?? null,
                          ogImages: (preview?.ogImages ?? [])
                            .filter(img => !!img?.url)
                            .map(img => ({
                              id: 'dev',
                              url: img?.url ?? '',
                              title: preview?.title ?? null,
                              description: preview?.description ?? null,
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
                  <DebugCards getPair={getPair} postPair={postPair} />

                  {parsedResources.length > 0 && (
                    <div className="pl-4">
                      <Accordion type="multiple" className="border-b-0">
                        {parsedResources.map((entry, idx) => (
                          <ResourceExecutor
                            key={idx}
                            resource={
                              {
                                id: `dev-${idx}`,
                                resource: submittedUrl,
                              } as unknown as any
                            }
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
    </div>
  );
};
