export const mcpSuccess = <T>(data: T) => {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
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
      ? { cause: JSON.stringify(error.cause) }
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
