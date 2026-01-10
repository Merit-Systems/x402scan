export enum OAuthErrorType {
  INVALID_REQUEST = 'invalid_request',
  SERVER_ERROR = 'server_error',
}

export interface OAuthErrorBody {
  error: OAuthErrorType;
  error_description?: string;
}

export class OAuthError extends Error {
  readonly body: OAuthErrorBody;
  constructor(body: OAuthErrorBody) {
    super(body.error);
    this.body = body;
  }
}
