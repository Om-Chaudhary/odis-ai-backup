#!/usr/bin/env npx tsx
/**
 * Generate JSON Schema files from Zod schemas for VAPI Dashboard
 *
 * This script converts our Zod schemas to JSON Schema format,
 * which can be used to configure VAPI assistant analysisPlan.
 *
 * Usage: npx tsx scripts/generate-vapi-schemas.ts
 * Output: docs/vapi/schemas/*.json
 *
 * Prerequisites:
 *   pnpm add -D zod-to-json-schema
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

import {
  CallOutcomeSchema,
  PetHealthSchema,
  MedicationComplianceSchema,
  OwnerSentimentSchema,
  EscalationSchema,
  FollowUpSchema,
  AttentionClassificationSchema,
  STRUCTURED_OUTPUT_NAMES,
} from "../libs/integrations/vapi/src/schemas/structured-outputs";

import { ACTION_CARD_OUTPUT_SCHEMA } from "../libs/integrations/vapi/src/schemas/action-card-output";

const OUTPUT_DIR = join(process.cwd(), "docs/vapi/schemas");

const zodSchemas = [
  { name: STRUCTURED_OUTPUT_NAMES.CALL_OUTCOME, schema: CallOutcomeSchema },
  { name: STRUCTURED_OUTPUT_NAMES.PET_HEALTH, schema: PetHealthSchema },
  {
    name: STRUCTURED_OUTPUT_NAMES.MEDICATION_COMPLIANCE,
    schema: MedicationComplianceSchema,
  },
  {
    name: STRUCTURED_OUTPUT_NAMES.OWNER_SENTIMENT,
    schema: OwnerSentimentSchema,
  },
  { name: STRUCTURED_OUTPUT_NAMES.ESCALATION, schema: EscalationSchema },
  { name: STRUCTURED_OUTPUT_NAMES.FOLLOW_UP, schema: FollowUpSchema },
  {
    name: STRUCTURED_OUTPUT_NAMES.ATTENTION,
    schema: AttentionClassificationSchema,
  },
];

// Pre-existing JSON schema (not Zod-based)
const legacySchemas = [
  {
    name: STRUCTURED_OUTPUT_NAMES.ACTION_CARD,
    schema: ACTION_CARD_OUTPUT_SCHEMA,
  },
];

async function main() {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Generating VAPI JSON Schemas...\n");
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  // Generate JSON schemas from Zod
  for (const { name, schema } of zodSchemas) {
    try {
      const jsonSchema = zodToJsonSchema(schema, {
        name,
        $refStrategy: "none",
      });

      const filename = `${name}.json`;
      const filepath = join(OUTPUT_DIR, filename);

      writeFileSync(filepath, JSON.stringify(jsonSchema, null, 2));
      console.log(`✓ Generated ${filename}`);
    } catch (error) {
      console.error(
        `✗ Failed to generate ${name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Write legacy JSON schemas as-is
  for (const { name, schema } of legacySchemas) {
    const filename = `${name}.json`;
    const filepath = join(OUTPUT_DIR, filename);

    writeFileSync(filepath, JSON.stringify(schema, null, 2));
    console.log(`✓ Copied ${filename} (legacy)`);
  }

  console.log(
    `\nDone! ${zodSchemas.length + legacySchemas.length} schemas written.`,
  );
}

main().catch((error) => {
  console.error("Schema generation failed:", error);
  process.exit(1);
});
