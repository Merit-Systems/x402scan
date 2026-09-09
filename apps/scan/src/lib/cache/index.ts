import { CACHE_DURATION_MINUTES } from "./constants";

// Discovery still uses Redis until the next migration in the stack.
export const CACHE_TTL_SECONDS = CACHE_DURATION_MINUTES * 60 * 2;
