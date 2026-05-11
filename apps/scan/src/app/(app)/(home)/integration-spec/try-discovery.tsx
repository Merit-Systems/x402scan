'use client';

import { useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import {
  DiscoveryPanel,
  useDiscovery,
} from '@/app/(app)/_components/discovery';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('://')) return trimmed;
  return `https://${trimmed}`;
}

export function TryDiscovery() {
  const [url, setUrl] = useState('');
  const normalizedUrl = useMemo(() => normalizeUrl(url), [url]);

  const {
    isValidUrl,
    urlOrigin,
    isDiscoveryLoading,
    discoveryFound,
    discoverySource,
    discoveryResources,
    discoveryResourceCount,
    discoveryError,
    preview,
    isPreviewLoading,
    testedResources,
    failedResources,
    isBatchTestLoading,
    refreshDiscovery,
    retryResource,
    ownershipVerified,
    ownershipProofs,
    payToAddresses,
    recoveredAddresses,
    verifiedAddresses,
    authModeMap,
  } = useDiscovery({ url: normalizedUrl });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <Label>Origin or endpoint URL</Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="https://yourdomain.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="pr-10"
              />
              {isDiscoveryLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Runs <code>discoverOriginSchema</code> against the origin and
              probes each discovered route. Nothing is registered.
            </p>
          </div>
        </CardContent>
      </Card>

      {isValidUrl && (
        <>
          {!isDiscoveryLoading && discoveryResourceCount > 0 && (
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshDiscovery}
                disabled={isBatchTestLoading}
                className="gap-1"
              >
                <RefreshCw
                  className={cn('size-3', isBatchTestLoading && 'animate-spin')}
                />
                Refresh
              </Button>
            </div>
          )}
          <DiscoveryPanel
            origin={urlOrigin}
            enteredUrl={normalizedUrl}
            isLoading={isDiscoveryLoading}
            found={discoveryFound}
            source={discoverySource}
            resources={discoveryResources}
            resourceCount={discoveryResourceCount}
            discoveryError={discoveryError}
            authModeMap={authModeMap}
            isRegisteringAll={false}
            mode="test"
            preview={preview}
            isPreviewLoading={isPreviewLoading}
            testedResources={testedResources}
            failedResources={failedResources}
            isBatchTestLoading={isBatchTestLoading}
            onRefresh={refreshDiscovery}
            onRetryResource={retryResource}
            ownershipVerified={ownershipVerified}
            ownershipProofs={ownershipProofs}
            payToAddresses={payToAddresses}
            recoveredAddresses={recoveredAddresses}
            verifiedAddresses={verifiedAddresses}
          />
        </>
      )}
    </div>
  );
}
