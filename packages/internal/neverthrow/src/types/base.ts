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
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
> = BE & {
  surface: Surface;
};

export type Result<
  T,
  ErrorTypes extends string,
  Surface extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
> = NeverthrowResult<T, Error<ErrorTypes, Surface, BE>>;

export type ResultAsync<
  T,
  ErrorTypes extends string,
  Surface extends string,
  BE extends BaseError<ErrorTypes> = BaseError<ErrorTypes>,
> = NeverthrowResultAsync<T, Error<ErrorTypes, Surface, BE>>;
