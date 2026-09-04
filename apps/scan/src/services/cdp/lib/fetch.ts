import { CdpError } from "./error";
import { generateCdpJwt } from "./generate-jwt";
import { cdpFetchSchema } from "./schema";

import type z from "zod";

export const cdpFetch = async <T>(
  request: z.input<typeof cdpFetchSchema>,
  outputSchema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> => {
  const { requestMethod, requestPath, requestHost } =
    cdpFetchSchema.parse(request);

  // Split path into base path (for JWT) and query params (for actual request)
  const [basePath] = requestPath.split("?");
  if (basePath === undefined) {
    throw new Error("CDP request path is empty");
  }

  const jwt = await generateCdpJwt({
    requestMethod: request.requestMethod,
    requestPath: basePath,
    requestHost: request.requestHost,
  });

  const url = `https://${requestHost}${requestPath}`;

  const response = await fetch(url, {
    ...init,
    method: request.requestMethod,
    headers: {
      // HeadersInit may be a Headers instance or entry array; normalize before
      // merging — spreading those into an object literal drops/garbles them.
      ...Object.fromEntries(new Headers(init?.headers).entries()),
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const message = `Failed to ${requestMethod} ${requestPath} from ${requestHost}: ${response.status}`;
    console.error(message);
    console.error("Response body:", errorBody);
    throw new CdpError(message, {
      status: response.status,
    });
  }

  return outputSchema.parse(await response.json());
};
