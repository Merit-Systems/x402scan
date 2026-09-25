import { PROBE_TIMEOUT_MS } from "./utils";

/**
 * A favicon that resolves server-side but that browsers refuse to render on
 * another origin.
 */
export interface BlockedFavicon {
  /** The favicon URL discovery resolved. */
  url: string;
  /** The `Cross-Origin-Resource-Policy` value that blocks it. */
  policy: "same-origin" | "same-site";
}

/**
 * Detect a favicon that x402scan can fetch but can't display.
 *
 * `Cross-Origin-Resource-Policy` is enforced by the browser on no-cors
 * subresource loads, so `same-origin` (Helmet's default, and therefore common
 * on Express APIs) means our `<img>` tag is blocked even though the icon is
 * served and reachable. The fetch succeeds server-side either way, so this has
 * to read the header rather than infer anything from the response body: the
 * failure only ever shows up in the visitor's browser, as a silent fallback to
 * the globe placeholder.
 *
 * Returns null when the header is absent or `cross-origin` — i.e. whenever the
 * icon will actually render.
 */
export async function detectBlockedFavicon(
  faviconUrl: string
): Promise<BlockedFavicon | null> {
  try {
    const url = new URL(faviconUrl);
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const policy = response.headers
      .get("cross-origin-resource-policy")
      ?.trim()
      .toLowerCase();

    // `same-site` blocks us too — x402scan is never same-site with a merchant
    // origin — so both restrictive values are reported.
    if (policy === "same-origin" || policy === "same-site") {
      return { url: faviconUrl, policy };
    }
    return null;
  } catch {
    return null;
  }
}
