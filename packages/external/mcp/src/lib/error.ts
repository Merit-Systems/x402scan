export type Error<T = unknown> = {
  message: string;
} & T;
