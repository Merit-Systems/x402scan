export class CdpError extends Error {
  public status: number;
  public innerError?: unknown;

  constructor(
    message: string,
    options: { status: number; innerError?: unknown }
  ) {
    super(message);
    this.name = 'CdpError';
    this.status = options.status;
    this.innerError = options.innerError;
    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CdpError);
    }
  }
}
