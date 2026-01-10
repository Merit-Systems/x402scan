import { NextResponse } from 'next/server';

import { createZodRoute } from '@/app/_lib/api/create-route';

import { OAuthError, OAuthErrorType } from './oauth-error';

import type { OAuthErrorBody } from './oauth-error';
import type {
  HandleInternalErrorFn,
  HandlerServerErrorFn,
  InternalRouteHandlerError,
} from '@/app/_lib/api/types';

const handleOAuthServerError: HandlerServerErrorFn<OAuthErrorBody> = (
  error: Error
) => {
  if (error instanceof OAuthError) {
    return NextResponse.json(error.body, { status: 400 });
  }
  return NextResponse.json(
    { error: OAuthErrorType.SERVER_ERROR, error_description: error.message },
    { status: 500 }
  );
};

const handleOAuthInternalError: HandleInternalErrorFn<OAuthErrorBody> = (
  error: InternalRouteHandlerError
) => {
  const { errors } = error.body;
  if (!errors?.length) {
    return NextResponse.json(
      { error: OAuthErrorType.SERVER_ERROR, error_description: error.message },
      { status: 500 }
    );
  }
  const firstError = errors[0]!;
  return NextResponse.json(JSON.parse(firstError.message) as OAuthErrorBody, {
    status: 400,
  });
};

export const oauthRoute = createZodRoute({
  handleServerError: handleOAuthServerError,
  handleInternalError: handleOAuthInternalError,
});

export const oauthValidationError = (error: OAuthErrorBody) =>
  JSON.stringify(error);
