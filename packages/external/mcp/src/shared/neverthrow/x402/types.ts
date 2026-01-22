import type { BaseError } from '@x402scan/neverthrow/types';

type X402ErrorType =
  | 'parse_payment_required'
  | 'create_payment_payload'
  | 'encode_payment_signature_header'
  | 'get_payment_settlement';

export type BaseX402Error = BaseError<X402ErrorType>;
