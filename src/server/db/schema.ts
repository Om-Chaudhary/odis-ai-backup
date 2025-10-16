// Odis AI Database Schema - Veterinary Practice Management System
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, pgTableCreator, pgEnum } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `odis-ai-web_${name}`);

// Enums
export const caseVisibilityEnum = pgEnum("CaseVisibility", [
  "public",
  "private",
]);
export const caseTypeEnum = pgEnum("CaseType", [
  "checkup",
  "emergency",
  "surgery",
  "follow_up",
]);
export const caseStatusEnum = pgEnum("CaseStatus", [
  "reviewed",
  "ongoing",
  "completed",
  "draft",
]);
export const userRoleEnum = pgEnum("user_role", [
  "veterinarian",
  "vet_tech",
  "admin",
  "practice_owner",
  "client",
]);
export const contactSubmissionStatusEnum = pgEnum("contact_submission_status", [
  "pending",
  "reviewed",
  "responded",
]);

// Users table - extends Supabase auth.users
export const users = createTable(
  "users",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`), // This will match Supabase auth.users.id
    email: d.text(),
    firstName: d.text(),
    lastName: d.text(),
    role: userRoleEnum().default("veterinarian"),
    clinicName: d.text(),
    licenseNumber: d.text(),
    onboardingCompleted: d.boolean().default(false),
    avatarUrl: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [index("users_email_idx").on(t.email)],
);

// Cases table - veterinary cases
export const cases = createTable(
  "cases",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: d.uuid().default(sql`auth.uid()`),
    visibility: caseVisibilityEnum(),
    type: caseTypeEnum(),
    status: caseStatusEnum(),
    createdAt: d.timestamp({ withTimezone: true }),
    updatedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("cases_user_id_idx").on(t.userId),
    index("cases_status_idx").on(t.status),
  ],
);

// Patients table
export const patients = createTable(
  "patients",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: d.text().notNull(),
    ownerName: d.text().notNull(),
    ownerEmail: d.text(),
    caseId: d.uuid(),
    userId: d.uuid(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [
    index("patients_case_id_idx").on(t.caseId),
    index("patients_user_id_idx").on(t.userId),
  ],
);

// Transcriptions table
export const transcriptions = createTable(
  "transcriptions",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    transcript: d.text(),
    speakerSegments: d.jsonb(),
    caseId: d.uuid(),
    audioFileId: d.uuid(),
    processingStatus: d.varchar().default("completed"),
    userId: d.uuid().default(sql`auth.uid()`),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [
    index("transcriptions_case_id_idx").on(t.caseId),
    index("transcriptions_user_id_idx").on(t.userId),
  ],
);

// Audio files table
export const audioFiles = createTable(
  "audio_files",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    filename: d.varchar().notNull(),
    filePath: d.varchar().notNull(),
    duration: d.real().notNull(),
    fileSize: d.numeric().notNull(),
    format: d.varchar().notNull(),
    sampleRate: d.integer(),
    channels: d.integer(),
    bitRate: d.integer(),
    transcriptionId: d.uuid(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [index("audio_files_transcription_id_idx").on(t.transcriptionId)],
);

// SOAP notes table
export const soapNotes = createTable(
  "soap_notes",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    transcript: d.text(),
    subjective: d.text(),
    objective: d.text(),
    assessment: d.text(),
    plan: d.text(),
    clientInstructions: d.text().default("NULL"),
    caseId: d.uuid(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [index("soap_notes_case_id_idx").on(t.caseId)],
);

// Templates table
export const templates = createTable(
  "templates",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: d.text(),
    type: d.text(),
    prompt: d.text(),
    model: d.text(),
    content: d.jsonb(),
    key: d.text(),
    description: d.text(),
    outputFormat: d.text().default("json"),
    validationSchema: d.jsonb().default("{}"),
    metadata: d.jsonb().default("{}"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [index("templates_key_idx").on(t.key)],
);

// Generations table
export const generations = createTable(
  "generations",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    prompt: d.text(),
    content: d.text(),
    templateId: d.uuid(),
    caseId: d.uuid(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [
    index("generations_template_id_idx").on(t.templateId),
    index("generations_case_id_idx").on(t.caseId),
  ],
);

// Discharge summaries table
export const dischargeSummaries = createTable(
  "discharge_summaries",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`extensions.uuid_generate_v4()`),
    caseId: d.uuid().notNull(),
    transcript: d.text(),
    summary: d.text(),
    userId: d.uuid().default(sql`auth.uid()`),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [
    index("discharge_summaries_case_id_idx").on(t.caseId),
    index("discharge_summaries_user_id_idx").on(t.userId),
  ],
);

// Contact submissions table
export const contactSubmissions = createTable(
  "contact_submissions",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    firstName: d.varchar().notNull(),
    lastName: d.varchar().notNull(),
    email: d.varchar().notNull(),
    practiceName: d.varchar().notNull(),
    message: d.text().notNull(),
    ipAddress: d.inet(),
    userAgent: d.text(),
    status: contactSubmissionStatusEnum().default("pending"),
    submittedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [index("contact_submissions_email_idx").on(t.email)],
);

// Temporary SOAP templates table
export const tempSoapTemplates = createTable(
  "temp_soap_templates",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    personName: d.text().notNull(),
    templateName: d.text().notNull(),
    systemPromptAddition: d.text(),
    templateId: d.text().notNull(),
    displayName: d.text().notNull(),
    iconName: d.text().notNull(),
    subjectiveTemplate: d.text(),
    objectiveTemplate: d.text(),
    subjectivePrompt: d.text(),
    objectivePrompt: d.text(),
    assessmentPrompt: d.text(),
    planPrompt: d.text(),
    clientInstructionsPrompt: d.text(),
    assessmentTemplate: d.text(),
    planTemplate: d.text(),
    clientInstructionsTemplate: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  }),
  (t) => [index("temp_soap_templates_template_id_idx").on(t.templateId)],
);
