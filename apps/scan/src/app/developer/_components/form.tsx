'use client';

import { useMemo, useState } from 'react';

import { ChevronDown, Plus, X } from 'lucide-react';

import { DiscoveryPanel, useDiscovery } from '@/app/_components/discovery';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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

import { isLocalUrl, extractPort } from '@/lib/url-helpers';
import { NgrokAlert } from './ngrok-alert';

export const TestEndpointForm = () => {
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([]);

  // Use shared discovery hook (test mode - no registration)
  const {
    urlOrigin,
    isDiscoveryLoading,
    discoveryFound,
    discoverySource,
    discoveryResources,
    discoveryResourceCount,
    preview: discoveryPreview,
    isPreviewLoading: isDiscoveryPreviewLoading,
    testedResources,
    failedResources,
    isBatchTestLoading,
    refreshDiscovery,
  } = useDiscovery({
    url,
  });

  const isLocalhost = useMemo(() => {
    try {
      // Try with http:// prefix if no protocol
      const urlToCheck = url.includes('://') ? url : `http://${url}`;
      return isLocalUrl(urlToCheck);
    } catch {
      return false;
    }
  }, [url]);

  const localPort = useMemo(() => {
    if (!isLocalhost) return null;
    try {
      const urlToCheck = url.includes('://') ? url : `http://${url}`;
      return extractPort(urlToCheck);
    } catch {
      return null;
    }
  }, [url, isLocalhost]);

  return (
    <div className="flex flex-col gap-4">
      {/* URL Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Test Endpoint</CardTitle>
          <CardDescription>
            Enter an endpoint URL to test. Results will appear automatically.
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

            {isLocalhost && <NgrokAlert port={localPort} />}

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
      </Card>

      {/* Results Panel - shows below input when we have results */}
      <DiscoveryPanel
        origin={urlOrigin}
        enteredUrl={url}
        isLoading={isDiscoveryLoading}
        found={discoveryFound}
        source={discoverySource}
        resources={discoveryResources}
        resourceCount={discoveryResourceCount}
        isRegisteringAll={false}
        mode="test"
        preview={discoveryPreview}
        isPreviewLoading={isDiscoveryPreviewLoading}
        testedResources={testedResources}
        failedResources={failedResources}
        isBatchTestLoading={isBatchTestLoading}
        onRefresh={refreshDiscovery}
      />
    </div>
  );
};
