import { IPolicy } from "cockatiel";
import { FacilitatorConfig } from 'x402/types';

export enum FacilitatorMethod {
  VERIFY = 'verify',
  SETTLE = 'settle',
}

export interface Facilitator extends FacilitatorConfig {
  name: string;
  circuitBreaker?: IPolicy;
}