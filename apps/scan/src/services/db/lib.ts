import { ok, err } from 'neverthrow';

import type { Err, Ok } from 'neverthrow';
import type { ErrorType } from '@/types/error';

export interface DatabaseError {
  type: ErrorType;
  message: string;
}

type DatabaseOk<T> = Ok<T, DatabaseError>;
type DatabaseErr<T> = Err<T, DatabaseError>;
// export type DatabaseResult<T> = Result<T, DatabaseError>;

export const dbOk = <T>(data: T): DatabaseOk<T> => ok(data);
export const dbErr = <T>(e: DatabaseError): DatabaseErr<T> => err(e);
