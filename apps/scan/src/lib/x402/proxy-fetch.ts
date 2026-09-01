import z from "zod";

import { env } from "@/env";
import { jsonObjectSchema, jsonValueSchema } from "@/lib/json";

import type { JsonValue } from "@/lib/json";

const PROXY_ENDPOINT = "/api/proxy" as const;

/**
 * JSON "containers": the values `JSON.parse` can produce that are not
 * string/number/boolean primitives.
 */
const jsonContainerSchema = z.union([
  jsonObjectSchema,
  z.array(jsonValueSchema),
  z.null(),
]);

const tryParseJson = (
  text: string
): { ok: true; value: JsonValue } | { ok: false } => {
  try {
    return { ok: true, value: jsonValueSchema.parse(JSON.parse(text)) };
  } catch {
    return { ok: false };
  }
};

export const fetchWithProxy = async (
  input: URL | RequestInfo,
  requestInit?: RequestInit
) => {
  let url: string;
  let effectiveInit: RequestInit | undefined = requestInit;

  if (input instanceof Request) {
    url = input.url;
    if (!requestInit) {
      const clonedRequest = input.clone();

      let body: string | undefined;
      if (input.method !== "GET" && input.method !== "HEAD") {
        try {
          body = await clonedRequest.text();
          if (!body) body = undefined;
        } catch {
          body = undefined;
        }
      }

      effectiveInit = {
        method: input.method,
        headers: input.headers,
        body,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
      };
    }
  } else {
    url = input.toString();
  }

  const proxyUrl = new URL(PROXY_ENDPOINT, env.NEXT_PUBLIC_PROXY_URL);
  proxyUrl.searchParams.set("url", encodeURIComponent(url));
  proxyUrl.searchParams.set("share_data", "true");

  const { method = "GET", ...restInit } = effectiveInit ?? {};
  const normalizedMethod = method.toUpperCase();

  const headers = new Headers(effectiveInit?.headers);

  if (
    normalizedMethod !== "GET" &&
    normalizedMethod !== "HEAD" &&
    restInit.body
  ) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // Clear body for GET/HEAD requests
  const finalInit: RequestInit = {
    ...restInit,
    method: normalizedMethod,
    headers,
  };

  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") {
    finalInit.body = undefined;
  }

  const bodyText = z.string().safeParse(finalInit.body);
  if (
    normalizedMethod !== "GET" &&
    normalizedMethod !== "HEAD" &&
    bodyText.success
  ) {
    const ct = headers.get("content-type") ?? "";

    const parsedOnce = tryParseJson(bodyText.data);
    if (parsedOnce.ok) {
      const innerJsonString = z.string().safeParse(parsedOnce.value);
      if (innerJsonString.success) {
        // If body is a JSON string literal whose contents are JSON, unwrap one layer.
        const parsedTwice = tryParseJson(innerJsonString.data);
        if (
          parsedTwice.ok &&
          jsonContainerSchema.safeParse(parsedTwice.value).success
        ) {
          finalInit.body = innerJsonString.data;
          headers.set("Content-Type", "application/json");
        }
      } else if (
        jsonContainerSchema.safeParse(parsedOnce.value).success &&
        (ct.toLowerCase().startsWith("text/plain") || ct === "")
      ) {
        headers.set("Content-Type", "application/json");
      }
    }
  }

  return fetch(proxyUrl.toString(), finalInit);
};
