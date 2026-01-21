import { NextResponse } from 'next/server';
import { ok, err } from 'neverthrow';

import type { Result, Err, Ok } from 'neverthrow';
import type { ErrorType } from '@/types/error';
import { errorTypeToStatusCode } from '@/types/error';

export interface DatabaseError {
  type: ErrorType;
  message: string;
}

type DatabaseOk<T> = Ok<T, DatabaseError>;
type DatabaseErr<T> = Err<T, DatabaseError>;
// export type DatabaseResult<T> = Result<T, DatabaseError>;

export const dbOk = <T>(data: T): DatabaseOk<T> => ok(data);
export const dbErr = <T>(e: DatabaseError): DatabaseErr<T> => err(e);

export const toNextResponse = <T>(result: Result<T, DatabaseError>) =>
  result.match(
    data => NextResponse.json({ success: true as const, data }),
    error =>
      NextResponse.json(
        { success: false as const, error: error.message },
        { status: errorTypeToStatusCode[error.type] }
      )
  );

export const dbErrorResponse = (error: DatabaseError) =>
  NextResponse.json(
    { success: false as const, error: error.message },
    { status: errorTypeToStatusCode[error.type] }
  );
