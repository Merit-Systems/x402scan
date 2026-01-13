/**
 * Sign-In-With-X Extension for x402 v2
 *
 * CAIP-122 compliant wallet authentication for payment-protected resources.
 * Allows clients to prove control of a wallet that may have previously paid
 * for a resource, enabling servers to grant access without requiring repurchase.
 *
 * ## Server Usage
 *
 * ```typescript
 * import {
 *   declareSIWxExtension,
 *   parseSIWxHeader,
 *   validateSIWxMessage,
 *   verifySIWxSignature,
 *   SIGN_IN_WITH_X,
 * } from '@x402/extensions/sign-in-with-x';
 *
 * // 1. Declare auth requirement in PaymentRequired response
 * const extensions = declareSIWxExtension({
 *   domain: 'api.example.com',
 *   resourceUri: 'https://api.example.com/data',
 *   network: 'eip155:8453',
 *   statement: 'Sign in to access your purchased content',
 * });
 *
 * // 2. Verify incoming proof
 * const header = request.headers.get('SIGN-IN-WITH-X');
 * if (header) {
 *   const payload = parseSIWxHeader(header);
 *
 *   const validation = await validateSIWxMessage(
 *     payload,
 *     'https://api.example.com/data'
 *   );
 *
 *   if (validation.valid) {
 *     const verification = await verifySIWxSignature(payload);
 *     if (verification.valid) {
 *       // Authentication successful!
 *       // verification.address is the verified wallet
 *     }
 *   }
 * }
 * ```
 *
 * ## Client Usage
 *
 * ```typescript
 * import {
 *   createSIWxPayload,
 *   encodeSIWxHeader,
 * } from '@x402/extensions/sign-in-with-x';
 *
 * // 1. Get extension info from 402 response
 * const serverInfo = paymentRequired.extensions['sign-in-with-x'].info;
 *
 * // 2. Create signed payload
 * const payload = await createSIWxPayload(serverInfo, wallet);
 *
 * // 3. Encode for header
 * const header = encodeSIWxHeader(payload);
 *
 * // 4. Send authenticated request
 * fetch(url, { headers: { 'SIGN-IN-WITH-X': header } });
 * ```
 *
 * @module sign-in-with-x
 */

// Constants
export { SIGN_IN_WITH_X, SIWxPayloadSchema } from "./types";
export { SOLANA_MAINNET, SOLANA_DEVNET, SOLANA_TESTNET } from "./solana";

// Types
export type {
  SIWxExtension,
  SIWxExtensionInfo,
  SIWxExtensionSchema,
  SIWxPayload,
  DeclareSIWxOptions,
  SignatureScheme,
  SignatureType,
  SIWxValidationResult,
  SIWxValidationOptions,
  SIWxVerifyResult,
  EVMMessageVerifier,
  SIWxVerifyOptions,
} from "./types";

// Server
export { declareSIWxExtension } from "./declare";
export { parseSIWxHeader } from "./parse";
export { validateSIWxMessage } from "./validate";
export { verifySIWxSignature } from "./verify";
export { buildSIWxSchema } from "./schema";

// Client
export { createSIWxMessage } from "./message";
export { createSIWxPayload } from "./client";
export { encodeSIWxHeader } from "./encode";
export {
  getEVMAddress,
  getSolanaAddress,
  signEVMMessage,
  signSolanaMessage,
  type SIWxSigner,
  type EVMSigner,
  type SolanaSigner,
} from "./sign";

// Chain utilities - EVM
export { formatSIWEMessage, verifyEVMSignature, extractEVMChainId } from "./evm";

// Chain utilities - Solana
export {
  formatSIWSMessage,
  verifySolanaSignature,
  decodeBase58,
  encodeBase58,
  extractSolanaChainReference,
} from "./solana";
