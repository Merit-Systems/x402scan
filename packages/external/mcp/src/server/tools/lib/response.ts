export const mcpSuccess = <T>(data: T) => {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
};

const formatErrorCause = (cause: unknown): string => {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;

  try {
    return JSON.stringify(cause) ?? 'Unknown cause';
  } catch {
    return 'Unserializable cause';
  }
};

export const mcpError = (error: unknown, context?: Record<string, unknown>) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error);

  const details =
    error instanceof Error && error.cause
      ? { cause: formatErrorCause(error.cause) }
      : undefined;

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            error: message,
            ...(details && { details }),
            ...(context && { context }),
          },
          null,
          2
        ),
      },
    ],
    isError: true as const,
  };
};
