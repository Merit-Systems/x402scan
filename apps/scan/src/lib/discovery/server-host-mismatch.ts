import { z } from "zod";

import { PROBE_TIMEOUT_MS } from "./utils";

/** The only part of an OpenAPI document this check reads. */
const serversSchema = z.object({
  servers: z.array(z.object({ url: z.string().min(1) })).optional(),
});

/**
 * An OpenAPI document that describes an API living on a different host than
 * the one serving the document.
 */
export interface ServerHostMismatch {
  /** Origin the document was fetched from — where we probed. */
  documentOrigin: string;
  /** Origin declared by the document's `servers[0].url` — where the API is. */
  declaredOrigin: string;
}

/**
 * Detect the "spec published on one host, API served from another" case.
 *
 * Discovery resolves every route against the origin it fetched the document
 * from, so a spec on `example.com` declaring `https://api.example.com` has all
 * of its endpoints probed against `example.com` and reported as 404s. The
 * generic "no 402 challenge" advice is actively misleading there: the paywall
 * is fine, we were knocking on the wrong host.
 *
 * Returns null when the document declares no server, declares a relative one,
 * or declares the same host we already probed — i.e. whenever the 404s have
 * some other cause.
 */
export async function detectServerHostMismatch(
  origin: string
): Promise<ServerHostMismatch | null> {
  try {
    const documentOrigin = new URL(origin).origin;
    const response = await fetch(`${documentOrigin}/openapi.json`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const doc = serversSchema.safeParse(await response.json());
    const serverUrl = doc.data?.servers?.[0]?.url;
    if (!serverUrl) return null;

    const declared = new URL(serverUrl);
    if (declared.protocol !== "http:" && declared.protocol !== "https:") {
      return null;
    }
    if (declared.origin === documentOrigin) return null;

    return { documentOrigin, declaredOrigin: declared.origin };
  } catch {
    return null;
  }
}
