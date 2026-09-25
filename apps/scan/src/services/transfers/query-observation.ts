import { AsyncLocalStorage } from "node:async_hooks";

/** Disposable benchmark observer. Ordinary application reads have no observer. */
export const queryObservation = new AsyncLocalStorage<
  (event: {
    phase: "start" | "end";
    target: string;
    attemptId: string;
    durationMs?: number;
    ok?: boolean;
  }) => void
>();

export async function observeQuery<T>(
  target: string,
  query: () => Promise<T>
): Promise<T> {
  const observer = queryObservation.getStore();
  if (!observer) return query();
  const attemptId = crypto.randomUUID();
  const start = performance.now();
  observer({ phase: "start", target, attemptId });
  try {
    const result = await query();
    observer({
      phase: "end",
      target,
      attemptId,
      durationMs: performance.now() - start,
      ok: true,
    });
    return result;
  } catch (error) {
    observer({
      phase: "end",
      target,
      attemptId,
      durationMs: performance.now() - start,
      ok: false,
    });
    throw error;
  }
}
