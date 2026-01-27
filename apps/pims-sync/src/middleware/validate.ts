/**
 * Zod Validation Middleware
 *
 * Validates request body against Zod schemas and returns consistent error responses.
 */

import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";
import { buildErrorResponse } from "../lib/response";

/**
 * Validation middleware factory
 *
 * @example
 * ```typescript
 * import { validate } from "../middleware/validate";
 * import { inboundSyncSchema } from "../schemas/sync.schema";
 *
 * router.post("/inbound", validate(inboundSyncSchema), async (req, res) => {
 *   // req.body is now typed and validated
 *   const { startDate, endDate } = req.body;
 *   // ...
 * });
 * ```
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    try {
      // Parse and validate request body
      const validatedData = schema.parse(req.body);

      // Replace req.body with validated data (typed and coerced)
      req.body = validatedData;

      // Continue to route handler
      next();
    } catch (error) {
      // Zod validation error - format and return
      if (isZodError(error)) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          validationErrors: formatZodErrors(error),
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Unexpected error
      res.status(500).json(buildErrorResponse(error, startTime));
    }
  };
}

/**
 * Type guard for ZodError
 */
function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues)
  );
}

/**
 * Format Zod validation errors into a readable structure
 */
function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
