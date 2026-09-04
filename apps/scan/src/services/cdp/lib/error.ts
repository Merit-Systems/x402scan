export class CdpError extends Error {
  public status: number;
  public innerError?: unknown;

  constructor(
    message: string,
    options: { status: number; innerError?: unknown }
  ) {
    super(message);
    this.name = "CdpError";
    this.status = options.status;
    this.innerError = options.innerError;
    Error.captureStackTrace(this, CdpError);
  }
}
