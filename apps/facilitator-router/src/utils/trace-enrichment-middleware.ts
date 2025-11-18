import { context, trace } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import logger, { requestIdStorage } from '../logger';

export function traceEnrichmentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  // Generate requestId (use X-Request-ID header if provided, otherwise generate new)
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Store requestId and startTime on request for later use
  (req as Request & { requestId: string; startTime: number }).requestId =
    requestId;
  (req as Request & { startTime: number }).startTime = startTime;

  // Set response header so client can correlate
  res.setHeader('X-Request-ID', requestId);

  // Set requestId on the span immediately so it's available for the entire trace
  const span = trace.getSpan(context.active());
  if (span) {
    span.setAttribute('request.id', requestId);
    span.setAttribute('http.request_id', requestId);
  }

  // Store requestId in AsyncLocalStorage so it's available to all logs
  // This wraps the entire request handling in the context
  requestIdStorage.run(requestId, () => {
    // Set up response finish handler before calling next()
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      // Log request (body will be available after express.json() parsing)
      const contentType = req.headers['content-type'] ?? '';
      const shouldLogBody: boolean =
        contentType.includes('application/json') &&
        req.body !== undefined &&
        JSON.stringify(req.body).length < 10000; // Max 10KB

      logger.info('REQUEST', {
        method: req.method,
        path: req.path,
        contentType,
        contentLength: req.headers['content-length'],
        body: shouldLogBody
          ? JSON.stringify(req.body)
          : '[BODY_TOO_LARGE_OR_BINARY]',
      });

      // Log response (requestId will be automatically injected by logger format)
      logger.info('RESPONSE', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
      });

      // Enrich OpenTelemetry span on finish
      const finishSpan = trace.getSpan(context.active());
      if (!finishSpan) return;

      // Standard semantic HTTP attributes
      finishSpan.setAttribute(SemanticAttributes.HTTP_METHOD, req.method);
      finishSpan.setAttribute(
        SemanticAttributes.HTTP_ROUTE,
        req.route && typeof req.route === 'object' && 'path' in req.route
          ? (req.route as { path: string }).path
          : req.path
      );
      finishSpan.setAttribute(SemanticAttributes.HTTP_TARGET, req.originalUrl);
      finishSpan.setAttribute(
        SemanticAttributes.HTTP_STATUS_CODE,
        res.statusCode
      );

      // Mark span status (0=UNSET, 1=OK, 2=ERROR)
      if (res.statusCode >= 500) {
        finishSpan.setStatus({ code: 2, message: `HTTP ${res.statusCode}` });
      } else {
        finishSpan.setStatus({ code: 1 });
      }
    });

    next();
  });
}
