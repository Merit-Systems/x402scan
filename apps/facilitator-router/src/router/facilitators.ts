import {
  circuitBreaker,
  handleAll,
  ConsecutiveBreaker,
  IPolicy,
} from 'cockatiel';
import { z } from 'zod';
import { Facilitator } from './types';
import { env } from '../env';
import { baseFacilitators } from 'facilitators';

/**
 * Create circuit breaker for a facilitator
 */
function createCircuitBreaker(): IPolicy {
    return circuitBreaker(handleAll, {
      halfOpenAfter: env.CIRCUIT_BREAKER_HALF_OPEN_AFTER,
      breaker: new ConsecutiveBreaker(env.CIRCUIT_BREAKER_CONSECUTIVE_FAILURES),
    });
  }

const FacilitatorIdsSchema = z.array(z.string().min(1));

const facilitatorIds = FacilitatorIdsSchema.parse(
  baseFacilitators.map((facilitator) => facilitator.id)
);
const whitelistedFacilitatorIds = env.WHITELISTED_FACILITATOR_IDS;

export const FacilitatorIdSchema = z.string().refine(
  (id) => facilitatorIds.includes(id) || id === 'auto',
  {
    message: `Facilitator ID must be one of: ${facilitatorIds.join(', ')} or 'auto'`,
  }
);

export type FacilitatorId = z.infer<typeof FacilitatorIdSchema>;

const facilitators: Facilitator[] = baseFacilitators
  .map((facilitator) => {
    let config;
    if (typeof facilitator.config === 'function') {
      if (facilitator.config.length === 0) {
        config = facilitator.config();
      } else if (facilitator.discoveryConfig) {
        config = facilitator.discoveryConfig;
      } else {
        return null;
      }
    } else {
      config = facilitator.config;
    }
    
    if (!config || typeof config !== 'object' || !('url' in config) || !config.url) {
      return null;
    }
    
    return {
      ...config,
      name: facilitator.id,
      ...(env.USE_CIRCUIT_BREAKER && { circuitBreaker: createCircuitBreaker() }),
    } as Facilitator;
  })
  .filter((facilitator): facilitator is Facilitator => facilitator !== null)
  .filter((facilitator) => whitelistedFacilitatorIds.includes(facilitator.name));


// Round-robin index for load balancing
let currentFacilitatorIndex = 0;

/**
 * Get next facilitator using round-robin load balancing
 */
export function getNextFacilitator(): Facilitator {
  const facilitator = facilitators[currentFacilitatorIndex];
  currentFacilitatorIndex = (currentFacilitatorIndex + 1) % facilitators.length;
  return facilitator;
}

/**
 * Get facilitator by ID
 */
export function getFacilitatorById(id: FacilitatorId): Facilitator | undefined {
  return facilitators.find((facilitator) => facilitator.name === id);
}

export { facilitators };
