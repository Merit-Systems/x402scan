import { RouteHandlerBuilder } from './handler-builder';
import type {
  HandleInternalErrorFn,
  HandlerServerErrorFn,
  InternalErrorBody,
  ServerErrorBody,
} from './types';

export function createZodRoute<
  TServerErrorBody = ServerErrorBody,
  TInternalErrorBody = InternalErrorBody,
>(params?: {
  handleServerError?: HandlerServerErrorFn<TServerErrorBody>;
  handleInternalError?: HandleInternalErrorFn<TInternalErrorBody>;
}) {
  return new RouteHandlerBuilder({
    handleServerError: params?.handleServerError,
    handleInternalError: params?.handleInternalError,
    contextType: {},
  });
}
