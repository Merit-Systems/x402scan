"use client";

import { useMemo, useState } from "react";

import { Loader2 } from "lucide-react";
import z from "zod";

import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/trpc/client";

function normalizeInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("://")) return trimmed;
  return `https://${trimmed}`;
}

function getPath(resourceUrl: string): string {
  try {
    const url = new URL(resourceUrl);
    return decodeURIComponent(`${url.pathname}${url.search}`);
  } catch {
    return resourceUrl;
  }
}

export function TryDiscovery() {
  const [url, setUrl] = useState("");
  const debouncedUrl = useDebounce(url, 500);
  const normalizedUrl = useMemo(
    () => normalizeInput(debouncedUrl),
    [debouncedUrl]
  );
  const isValidUrl = z.url().safeParse(normalizedUrl).success;
  const origin = isValidUrl ? new URL(normalizedUrl).origin : null;

  const discovery = api.public.resources.checkDiscovery.useQuery(
    { origin: origin ?? "", bustCache: false },
    {
      enabled: origin !== null && debouncedUrl === url,
      retry: false,
      staleTime: 30_000,
    }
  );

  const resources = discovery.data?.found ? discovery.data.resources : [];
  const isLoading =
    isValidUrl && debouncedUrl === url && discovery.isPending && url.length > 0;

  return (
    <div className="flex flex-col gap-4" data-not-typeset>
      <Card>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="discovery-url">
              Origin or endpoint URL
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="discovery-url"
                type="text"
                placeholder="https://yourdomain.com"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                }}
              />
              {isLoading ? (
                <InputGroupAddon align="inline-end">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            <FieldDescription>
              Runs discovery against the origin and lists the routes x402scan
              resolves. Nothing is registered.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      {isValidUrl && discovery.isSuccess && resources.length > 0 ? (
        <Card>
          <CardContent>
            <p className="mb-2 type-label">
              Found {resources.length} endpoint
              {resources.length === 1 ? "" : "s"}
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {resources.slice(0, 10).map((resource) => (
                <li key={`${resource.method ?? "GET"}-${resource.url}`}>
                  <code className="type-compact-code">
                    <strong className="text-foreground">
                      {resource.method ?? "GET"}
                    </strong>{" "}
                    {getPath(resource.url)}
                  </code>
                </li>
              ))}
              {resources.length > 10 ? (
                <li className="text-muted-foreground/60">
                  ...and {resources.length - 10} more
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {isValidUrl &&
      discovery.isSuccess &&
      (!discovery.data.found || resources.length === 0) ? (
        <p className="type-supporting-body text-muted-foreground">
          {discovery.data.found
            ? "No discoverable endpoints found at this origin."
            : (discovery.data.error ??
              "No discoverable endpoints found at this origin.")}
        </p>
      ) : null}

      {isValidUrl && discovery.isError ? (
        <p className="type-supporting-body text-destructive">
          Discovery failed. Check the URL and try again.
        </p>
      ) : null}
    </div>
  );
}
