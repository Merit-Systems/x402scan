type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'payment_required'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'offline'
  | 'server';

type Surface = 'chat' | 'auth' | 'api' | 'database' | 'tool';

type ErrorCode = `${ErrorType}:${Surface}`;

type ErrorVisibility = 'response' | 'log' | 'none';

const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: 'log',
  chat: 'response',
  auth: 'response',
  api: 'response',
  tool: 'response',
};

export class ChatError extends Error {
  public type: ErrorType;
  public surface: Surface;
  public statusCode: number;

  constructor(errorCode: ErrorCode, message?: string, cause?: string) {
    super();

    const [type, surface] = errorCode.split(':');

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = message ?? getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  static fromStatusCode(
    statusCode: number,
    surface: Surface,
    message?: string,
    cause?: string
  ) {
    const type = getTypeByStatusCode(statusCode);
    const errorCode: ErrorCode = `${type}:${surface}`;
    return new ChatError(errorCode, message, cause);
  }

  public toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === 'log') {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: '', message: 'Something went wrong. Please try again later.' },
        { status: statusCode }
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes('database')) {
    return 'An error occurred while executing a database query.';
  }

  switch (errorCode) {
    case 'bad_request:api':
      return "The request couldn't be processed. Please check your input and try again.";

    case 'unauthorized:auth':
      return 'You need to sign in before continuing.';
    case 'forbidden:auth':
      return 'Your account does not have access to this feature.';

    case 'not_found:chat':
      return 'The requested chat was not found. Please check the chat ID and try again.';
    case 'forbidden:chat':
      return 'This chat belongs to another user. Please check the chat ID and try again.';
    case 'unauthorized:chat':
      return 'You need to sign in to view this chat. Please sign in and try again.';
    case 'offline:chat':
      return "We're having trouble sending your message. Please check your internet connection and try again.";
    case 'payment_required:chat':
      return 'Out of funds. Please deposit more funds to continue.';
    case 'server:chat':
      return 'An error occurred while processing your request. Please try again later.';

    case 'bad_request:tool':
      return "The tool request couldn't be processed. Please check your input and try again.";
    case 'unauthorized:tool':
      return 'You need to sign in to use this tool.';
    case 'payment_required:tool':
      return toolPaymentRequiredMessage;
    case 'forbidden:tool':
      return 'You do not have access to use this tool.';
    case 'not_found:tool':
      return 'The requested tool was not found. Please check the tool ID and try again.';
    case 'server:tool':
      return 'An error occurred while executing the tool. Please try again later.';
    case 'rate_limit:tool':
      return 'You are using tools too quickly. Please wait and try again.';
    case 'offline:tool':
      return "We're having trouble connecting to the tool. Please check your internet connection and try again.";

    default:
      return 'Something went wrong. Please try again later.';
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case 'bad_request':
      return 400;
    case 'unauthorized':
      return 401;
    case 'payment_required':
      return 402;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'offline':
      return 503;
    default:
      return 500;
  }
}

function getTypeByStatusCode(statusCode: number): ErrorType {
  switch (statusCode) {
    case 400:
      return 'bad_request';
    case 401:
      return 'unauthorized';
    case 402:
      return 'payment_required';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 429:
      return 'rate_limit';
    case 503:
      return 'offline';
    default:
      return 'server';
  }
}

export const toolPaymentRequiredMessage =
  'You do not have enough funds to use this tool. Please add more funds to continue.';
