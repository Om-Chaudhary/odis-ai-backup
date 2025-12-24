# @odis-ai/validators

Shared Zod validation schemas for the ODIS AI platform. Used by both tRPC routers and REST API endpoints to ensure type-safe data validation across the application.

## Overview

This library provides comprehensive validation schemas for:

- AI Veterinary Scribe (normalization and entity extraction)
- Assessment Questions (AI-generated follow-up questions)
- Discharge Summaries (structured medical summaries)
- Discharge Emails (scheduling and content)
- Orchestration Requests (workflow coordination)
- Schedule Sync (IDEXX Neo appointment synchronization)

## Installation

This is an internal library in the Nx monorepo. Import from `@odis-ai/validators`:

```typescript
import {
  NormalizeRequestSchema,
  AppointmentInputSchema,
} from "@odis-ai/validators";
```

## Usage Examples

### Basic Validation

```typescript
import { NormalizeRequestSchema } from "@odis-ai/validators";

const result = NormalizeRequestSchema.safeParse({
  input: "Clinical notes here...",
  inputType: "transcript",
});

if (result.success) {
  // Use validated data
  console.log(result.data);
} else {
  // Handle validation errors
  console.error(result.error);
}
```

### Type Inference

```typescript
import {
  NormalizeRequestSchema,
  type NormalizeRequest,
} from "@odis-ai/validators";

// Infer TypeScript type from schema
type Request = NormalizeRequest; // Same as z.infer<typeof NormalizeRequestSchema>
```

### In tRPC Routers

```typescript
import { NormalizeRequestSchema } from "@odis-ai/validators";
import { z } from "zod";

export const scribeRouter = router({
  normalize: protectedProcedure
    .input(NormalizeRequestSchema)
    .mutation(async ({ input, ctx }) => {
      // input is fully typed and validated
      return await normalizeText(input);
    }),
});
```

### In API Routes

```typescript
import { ScheduleSyncRequestSchema } from "@odis-ai/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const result = ScheduleSyncRequestSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 },
    );
  }

  // Process validated data
  return NextResponse.json({ success: true });
}
```

## Available Schemas

### Scribe Schemas (`scribe.ts`)

- `NormalizeRequestSchema` - Request for text normalization
- `ExtractedPatientSchema` - Patient information from extraction
- `ClinicalDetailsSchema` - Clinical data from extraction
- `NormalizedEntitiesSchema` - Complete entity extraction result
- `NormalizeResponseSchema` - API response format
- `CaseTypeSchema` - Case type enumeration

**Helper Functions:**

- `parseWeightToKg(weight)` - Convert weight strings to kg
- `parseAgeToDOB(age)` - Convert age strings to date of birth
- `sanitizePhoneNumber(phone)` - Format phone to E.164

### Assessment Questions (`assessment-questions.ts`)

- `AssessmentQuestionSchema` - Single assessment question
- `GeneratedCallIntelligenceSchema` - Complete call intelligence package
- `GenerateCallIntelligenceInputSchema` - Input for generating questions

### Discharge Schemas (`discharge.ts`)

- `generateEmailSchema` - Generate discharge email content
- `sendEmailSchema` - Send/schedule discharge email
- `generateSummarySchema` - Generate discharge summary

### Discharge Summary (`discharge-summary.ts`)

- `MedicationSchema` - Medication information
- `HomeCareInstructionsSchema` - Home care instructions
- `FollowUpSchema` - Follow-up requirements
- `DischargeCaseTypeSchema` - Discharge case types
- `StructuredDischargeSummarySchema` - Complete summary structure

**Helper Functions:**

- `validateStructuredSummary(data)` - Validate summary with detailed errors
- `structuredToPlainText(summary)` - Convert to plain text format
- `createEmptyStructuredSummary(name)` - Create default summary

### Orchestration (`orchestration.ts`)

- `OrchestrationRequestSchema` - Complete orchestration workflow request
- Step configuration schemas for all workflow steps
- Input schemas for raw data and existing cases

### Schedule Sync (`lib/schedule.ts`)

- `AppointmentInputSchema` - Single appointment data
- `ScheduleSyncRequestSchema` - Batch appointment sync request

## Testing

Comprehensive test suite with 95%+ coverage:

```bash
# Run tests
pnpm nx test validators

# Run tests in watch mode
pnpm nx test:watch validators

# Run with coverage report
pnpm nx test:coverage validators
```

See [TEST_COVERAGE.md](./TEST_COVERAGE.md) for detailed coverage information.

## Schema Design Principles

1. **Strict Validation**: All schemas enforce strict validation rules
2. **Type Safety**: Full TypeScript type inference
3. **Error Messages**: Descriptive error messages for debugging
4. **Optional vs Required**: Clear distinction with sensible defaults
5. **Coercion**: Strategic use of Zod coercion (e.g., dates)
6. **Refinements**: Custom validation logic where needed
7. **Composition**: Reusable schema components

## Validation Patterns

### Required vs Optional Fields

```typescript
z.object({
  required: z.string(), // Must be provided
  optional: z.string().optional(), // Can be undefined
  nullable: z.string().nullable(), // Can be null
  withDefault: z.string().default("value"), // Uses default if not provided
});
```

### String Validation

```typescript
z.string()
  .min(1, "Cannot be empty")
  .max(100, "Too long")
  .email("Invalid email")
  .uuid("Invalid UUID")
  .regex(/pattern/, "Invalid format");
```

### Array Validation

```typescript
z.array(ItemSchema).min(1, "At least one required").max(10, "Too many items");
```

### Custom Refinements

```typescript
z.object({ start: z.string(), end: z.string() }).refine(
  (data) => data.end > data.start,
  { message: "End must be after start" },
);
```

## Common Validation Errors

### Missing Required Field

```json
{
  "code": "invalid_type",
  "expected": "string",
  "received": "undefined",
  "path": ["fieldName"],
  "message": "Required"
}
```

### Invalid Format

```json
{
  "code": "invalid_string",
  "validation": "email",
  "path": ["email"],
  "message": "Invalid email"
}
```

### Out of Range

```json
{
  "code": "too_small",
  "minimum": 1,
  "type": "string",
  "path": ["input"],
  "message": "Input too short (minimum 50 characters)"
}
```

## Best Practices

1. **Always use `safeParse()`** - Don't let validation errors throw
2. **Validate at boundaries** - API routes, tRPC procedures, external data
3. **Provide context in errors** - Use custom error messages
4. **Test edge cases** - Empty strings, null, undefined, boundary values
5. **Document schemas** - Add JSDoc comments for schema purpose
6. **Use type exports** - Export both schema and inferred type
7. **Compose schemas** - Build complex schemas from simple ones

## Contributing

When adding new schemas:

1. Add schema to appropriate file or create new file
2. Export schema and type from `index.ts`
3. Add comprehensive tests in `__tests__/`
4. Document schema in this README
5. Update TEST_COVERAGE.md

## Dependencies

- `zod` - Schema validation library

## Related Libraries

- `@odis-ai/db` - Database client and repositories (uses validators)
- `@odis-ai/api` - API utilities (uses validators)
- `@odis-ai/services` - Business logic (uses validators)

## License

Private - ODIS AI Platform
