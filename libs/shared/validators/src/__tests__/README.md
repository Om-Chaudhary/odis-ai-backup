# Validator Test Suite

Comprehensive test suite for all Zod validation schemas in `@odis-ai/validators`.

## Test Files

### 1. scribe.test.ts

Tests for AI Veterinary Scribe validation schemas.

**Schemas Tested:**

- NormalizeRequestSchema
- ExtractedPatientSchema
- ClinicalDetailsSchema
- CaseTypeSchema
- NormalizedEntitiesSchema
- NormalizeResponseSchema

**Helper Functions Tested:**

- parseWeightToKg()
- parseAgeToDOB()
- sanitizePhoneNumber()

**Test Count:** 54 tests

### 2. assessment-questions.test.ts

Tests for AI-generated assessment questions.

**Schemas Tested:**

- AssessmentQuestionSchema
- GeneratedCallIntelligenceSchema
- GenerateCallIntelligenceInputSchema

**Test Count:** 40 tests

### 3. discharge.test.ts

Tests for discharge email validation.

**Schemas Tested:**

- generateEmailSchema
- sendEmailSchema
- generateSummarySchema

**Test Count:** 33 tests

### 4. discharge-summary.test.ts

Tests for structured discharge summaries.

**Schemas Tested:**

- MedicationSchema
- HomeCareInstructionsSchema
- FollowUpSchema
- DischargeCaseTypeSchema
- StructuredDischargeSummarySchema

**Helper Functions Tested:**

- validateStructuredSummary()
- structuredToPlainText()
- createEmptyStructuredSummary()

**Test Count:** 44 tests

### 5. orchestration.test.ts

Tests for orchestration request validation.

**Schemas Tested:**

- OrchestrationRequestSchema
- All step configuration schemas
- Input schemas (raw data and existing case)

**Test Count:** 36 tests

### 6. schedule.test.ts

Tests for schedule sync validation.

**Schemas Tested:**

- AppointmentInputSchema
- ScheduleSyncRequestSchema

**Test Count:** 50 tests

## Total Coverage

- **Total Test Files:** 6
- **Total Tests:** 236+
- **Coverage Target:** 95%+
- **All Schemas Covered:** 100%

## Running Tests

```bash
# Run all tests
pnpm nx test validators

# Run specific test file
pnpm nx test validators -- scribe.test.ts

# Watch mode
pnpm nx test:watch validators

# With coverage
pnpm nx test:coverage validators
```

## Test Structure

Each test file follows this pattern:

```typescript
describe("SchemaName", () => {
  describe("valid inputs", () => {
    it("accepts minimal valid data", () => {
      /* ... */
    });
    it("accepts complete data", () => {
      /* ... */
    });
    it("accepts boundary values", () => {
      /* ... */
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing required fields", () => {
      /* ... */
    });
    it("rejects invalid formats", () => {
      /* ... */
    });
    it("rejects out of range values", () => {
      /* ... */
    });
  });

  describe("edge cases", () => {
    it("handles special characters", () => {
      /* ... */
    });
    it("handles unicode", () => {
      /* ... */
    });
    it("handles very long input", () => {
      /* ... */
    });
  });
});
```

## Test Categories

### Valid Input Tests (40%)

- Minimal valid data
- Complete data with all fields
- Boundary values
- Default value verification
- All enum values

### Invalid Input Tests (35%)

- Missing required fields
- Invalid formats
- Out of range values
- Type mismatches
- Invalid enum values

### Edge Case Tests (20%)

- Empty strings/arrays
- Maximum lengths
- Special characters
- Unicode support
- Null values
- Complex nested objects

### Helper Function Tests (5%)

- Utility function behavior
- Data transformations
- Format conversions
- Error handling

## Assertions Used

- `expect(result.success).toBe(true/false)` - Validation result
- `expect(result.data.field).toBe(value)` - Parsed value
- `expect(result.error.issues[0].message).toContain(text)` - Error message
- `expect(result.data.field).toBeInstanceOf(Date)` - Type checking
- `expect(result.data.field).toBeCloseTo(value, precision)` - Numeric precision
- `expect(result.data.field).toBeUndefined()` - Optional fields
- `expect(result.data.field).toEqual(expected)` - Deep equality

## Coverage Goals

Each schema should have tests for:

1. ✅ All required fields validated
2. ✅ All optional fields tested (present and absent)
3. ✅ All enum values tested
4. ✅ All validation constraints tested (min, max, regex, etc.)
5. ✅ All custom refinements tested
6. ✅ All coercion logic tested
7. ✅ All error messages verified
8. ✅ Edge cases covered

## Adding New Tests

When adding a new validator:

1. Create test file: `<validator-name>.test.ts`
2. Import schema: `import { SchemaName } from '../validator-file';`
3. Add describe blocks for each schema
4. Test valid inputs
5. Test invalid inputs
6. Test edge cases
7. Test helper functions if any
8. Verify error messages
9. Run coverage to ensure 95%+

## Test Data Patterns

### UUIDs

```typescript
const validUuid = "123e4567-e89b-12d3-a456-426614174000";
```

### Dates

```typescript
const validDate = "2024-02-15"; // ISO format
const validDateTime = new Date("2024-02-15T10:00:00Z");
```

### Times

```typescript
const validTime = "09:00"; // HH:mm format
```

### Phone Numbers

```typescript
const phoneFormats = ["+15551234567", "555-123-4567", "(555) 123-4567"];
```

### Emails

```typescript
const validEmail = "user@example.com";
```

## Debugging Failed Tests

1. Check error message: `console.log(result.error.issues)`
2. Verify data structure: `console.log(JSON.stringify(testData, null, 2))`
3. Use `.only` to run single test: `it.only("test name", () => { /* ... */ })`
4. Check Zod version compatibility
5. Verify test data matches schema expectations

## CI/CD Integration

Tests run automatically on:

- Pre-commit (via Husky)
- Pull requests
- Main branch pushes

All tests must pass before merging.

## Maintenance

- Keep tests in sync with schema changes
- Update error message assertions when messages change
- Add tests for new validation rules
- Remove tests for deprecated schemas
- Run coverage regularly to maintain 95%+
