import { createHash, timingSafeEqual } from "node:crypto";

export function benchmarkAccess(
  environment: string | undefined,
  token: string | undefined,
  authorization: string | null
) {
  if (environment !== "preview" || !token || token.length < 32) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(
    digest(authorization ?? ""),
    digest(`Bearer ${token}`)
  );
}
