/**
 * Custom error types for the facilitator router
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - thrown when request payload validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: string) {
    super(message, 400);
  }
}

/**
 * Facilitator error - thrown when a facilitator request fails
 */
export class FacilitatorError extends AppError {
  constructor(
    message: string,
    public readonly facilitatorName: string,
    public readonly httpStatus: number,
    public readonly errorMessageJson: Record<string, unknown>,
    public readonly responseHeaders: Record<string, string>
  ) {
    super(message, httpStatus);
  }
}

/**
 * All facilitators failed error - thrown when all facilitators fail to process a request
 */
export class AllFacilitatorsFailedError extends AppError {
  constructor(
    public readonly method: string,
    public readonly errors: Array<{ facilitator: string; error: string }>
  ) {
    const errorDetails = errors
      .map(e => `${e.facilitator}: ${e.error}`)
      .join('; ');
    super(`All facilitators failed for ${method}: ${errorDetails}`, 503);
  }
}
/**
 * Invalid data error - thrown when data format is invalid
 */
export class InvalidDataError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * Database error - thrown when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public readonly operation?: string,
    public readonly originalError?: unknown
  ) {
    super(message, 500);
  }
}

/**
 * JSON parsing error - thrown when JSON parsing fails
 */
export class JsonParsingError extends AppError {
  constructor(
    message: string,
    public readonly rawText?: string
  ) {
    super(message, 400);
  }
}

/**
 * Facilitator failed error - thrown when a single facilitator attempt fails
 */
export class FacilitatorFailedError extends AppError {
  constructor(
    public readonly facilitatorName: string,
    public readonly error: string
  ) {
    super(`Facilitator ${facilitatorName} failed: ${error}`, 503);
  }
}
