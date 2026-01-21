import type {
  Result as NeverthrowResult,
  ResultAsync as NeverthrowResultAsync,
} from 'neverthrow';

export interface BaseError<ErrorTypes extends string> {
  type: ErrorTypes;
  message: string;
}

export type Error<
  ErrorTypes extends string,
  Surface extends string,
> = BaseError<ErrorTypes> & {
  surface: Surface;
};

export type Result<
  T,
  ErrorTypes extends string,
  Surface extends string,
> = NeverthrowResult<T, Error<ErrorTypes, Surface>>;

export type ResultAsync<
  T,
  ErrorTypes extends string,
  Surface extends string,
> = NeverthrowResultAsync<T, Error<ErrorTypes, Surface>>;
