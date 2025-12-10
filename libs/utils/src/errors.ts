/**
 * Custom API Error Classes
 *
 * Standardized error types for consistent error handling across all API routes.
 * Each error class includes:
 * - Error code (for client-side handling)
 * - HTTP status code
 * - Error message
 * - Optional error details (validation errors, stack traces, etc.)
 *
 * @example
 * ```ts
 * throw new ValidationError("Invalid email address", {
 *   field: "email",
 *   value: "invalid@"
 * });
 *
 * throw new UnauthorizedError("JWT token expired");
 *
 * throw new NotFoundError("Call not found", { callId: "123" });
 * ```
 */

/**
 * Base API error class
 *
 * All custom errors should extend this class
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Validation errors, malformed requests
 *
 * @example
 * ```ts
 * throw new ValidationError("Phone number must be in E.164 format", {
 *   field: "phoneNumber",
 *   value: "123-456-7890",
 *   expected: "+11234567890"
 * });
 * ```
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 *
 * @example
 * ```ts
 * throw new UnauthorizedError("Authentication token is missing");
 * throw new UnauthorizedError("Invalid or expired token");
 * ```
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

/**
 * 403 Forbidden - Authenticated but lacks permissions
 *
 * @example
 * ```ts
 * throw new ForbiddenError("You don't have permission to access this resource");
 * throw new ForbiddenError("Admin access required");
 * ```
 */
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 *
 * @example
 * ```ts
 * throw new NotFoundError("Call not found", { callId: "123" });
 * throw new NotFoundError("User profile not found");
 * ```
 */
export class NotFoundError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("NOT_FOUND", message, 404, details);
    this.name = "NotFoundError";
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate records)
 *
 * @example
 * ```ts
 * throw new ConflictError("Call already scheduled for this time", {
 *   scheduledFor: "2025-11-17T10:00:00Z",
 *   existingCallId: "456"
 * });
 * ```
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("CONFLICT", message, 409, details);
    this.name = "ConflictError";
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 *
 * @example
 * ```ts
 * throw new RateLimitError("Too many requests", {
 *   retryAfter: 60,
 *   limit: 100,
 *   windowMs: 60000
 * });
 * ```
 */
export class RateLimitError extends ApiError {
  constructor(message = "Too many requests", details?: unknown) {
    super("RATE_LIMIT_EXCEEDED", message, 429, details);
    this.name = "RateLimitError";
  }
}

/**
 * 500 Internal Server Error - Database errors
 *
 * @example
 * ```ts
 * throw new DatabaseError("Failed to create record", {
 *   table: "scheduled_discharge_calls",
 *   operation: "insert",
 *   error: supabaseError
 * });
 * ```
 */
export class DatabaseError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("DATABASE_ERROR", message, 500, details);
    this.name = "DatabaseError";
  }
}

/**
 * 500 Internal Server Error - External service failures
 *
 * @example
 * ```ts
 * throw new ExternalServiceError("VAPI call creation failed", {
 *   service: "vapi",
 *   endpoint: "/call",
 *   error: vapiError
 * });
 * ```
 */
export class ExternalServiceError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("EXTERNAL_SERVICE_ERROR", message, 500, details);
    this.name = "ExternalServiceError";
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 *
 * @example
 * ```ts
 * throw new ServiceUnavailableError("Maintenance in progress", {
 *   retryAfter: 300,
 *   maintenanceWindow: "2025-11-17T02:00-04:00"
 * });
 * ```
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message = "Service temporarily unavailable", details?: unknown) {
    super("SERVICE_UNAVAILABLE", message, 503, details);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Helper to determine if an error is an ApiError instance
 *
 * @param error - Error to check
 * @returns True if error is an ApiError
 *
 * @example
 * ```ts
 * try {
 *   // some operation
 * } catch (error) {
 *   if (isApiError(error)) {
 *     return errorResponse(error, error.status);
 *   }
 *   // handle unexpected errors
 * }
 * ```
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Converts unknown errors to ApiError instances
 *
 * @param error - Any error type
 * @returns ApiError instance
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const apiError = toApiError(error);
 *   logger.error(apiError.message, apiError.details);
 *   return errorResponse(apiError);
 * }
 * ```
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError("INTERNAL_ERROR", error.message, 500, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new ApiError("UNKNOWN_ERROR", "An unknown error occurred", 500, {
    error: String(error),
  });
}
