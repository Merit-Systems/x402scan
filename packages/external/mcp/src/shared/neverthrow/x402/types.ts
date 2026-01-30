import type { BaseError } from '@x402scan/neverthrow/types';

type X402ErrorType =
  | 'parse_payment_required'
  | 'create_payment_payload'
  | 'encode_payment_signature_header'
  | 'get_payment_settlement'
  | 'create_siwx_payload'
  | 'payment_already_attempted'
  | 'not_x402';

export type BaseX402Error = BaseError<X402ErrorType>;
