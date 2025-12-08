# VAPI Calls Data Dictionary

Quick reference for all fields in the VAPI scheduled discharge calls datasets.

## Core Identifiers

| Field        | Type   | Description                   | Example                              | Null? |
| ------------ | ------ | ----------------------------- | ------------------------------------ | ----- |
| call_id      | UUID   | Unique call record identifier | acf02905-1ad9-488f-a147-e2063759472c | No    |
| vapi_call_id | String | VAPI platform call ID         | 019af6c0-dad4-7881-b6d5-59042c83c5bc | No    |
| case_id      | UUID   | Associated veterinary case    | ef26e69d-5493-4ec5-be16-3d3950800664 | Yes   |
| user_id      | UUID   | User who created the call     | (not exported)                       | No    |

## Temporal Fields

| Field         | Type     | Format     | Description                | Example                  | Null? |
| ------------- | -------- | ---------- | -------------------------- | ------------------------ | ----- |
| created_at    | DateTime | ISO 8601   | Record creation timestamp  | 2025-12-07T02:59:25Z     | No    |
| scheduled_for | DateTime | ISO 8601   | Scheduled call time        | 2025-12-07T03:00:25.648Z | No    |
| started_at    | DateTime | ISO 8601   | Actual call start time     | 2025-12-07T03:00:36.853Z | Yes   |
| ended_at      | DateTime | ISO 8601   | Call end time              | 2025-12-07T03:02:18.557Z | Yes   |
| call_date     | Date     | YYYY-MM-DD | Date portion of created_at | 2025-12-07               | No    |
| call_time     | Time     | HH:MM:SS   | Time portion of created_at | 02:59:25                 | No    |

## Calculated Temporal Fields

| Field                  | Type    | Calculation                          | Description                       | Example     | Null? |
| ---------------------- | ------- | ------------------------------------ | --------------------------------- | ----------- | ----- |
| day_name               | String  | from created_at                      | Day of week (full name)           | Saturday    | No    |
| day_of_week_num        | Integer | from created_at                      | 0=Sunday, 6=Saturday              | 6           | No    |
| hour_of_day            | Integer | from created_at                      | Hour in 24-hour format (0-23)     | 18          | No    |
| day_type               | String  | from day_of_week_num                 | "Weekday" or "Weekend"            | Weekend     | No    |
| day_type_code          | Integer | from day_of_week_num                 | 1=Weekday, 0=Weekend              | 0           | No    |
| time_category          | String  | from hour + day                      | "Business Hours" or "After Hours" | After Hours | No    |
| time_category_code     | Integer | from hour + day                      | 1=Business, 0=After Hours         | 0           | No    |
| schedule_delay_minutes | Decimal | (started_at - scheduled_for) / 60000 | Minutes delayed from schedule     | 0.19        | Yes   |

### Business Hours Definition

- **Business Hours**: Monday-Friday, 9:00 AM - 5:00 PM
- **After Hours**: All other times (evenings, weekends, holidays)

## Contact Information

| Field          | Type   | Format   | Description                     | Example      | Null? |
| -------------- | ------ | -------- | ------------------------------- | ------------ | ----- |
| customer_phone | String | E.164    | International phone format      | +14084254890 | No    |
| area_code      | String | 3 digits | Extracted area code (US/Canada) | 408          | Yes   |

## Call Metrics

| Field              | Type    | Unit    | Description             | Example | Null? |
| ------------------ | ------- | ------- | ----------------------- | ------- | ----- |
| duration_seconds   | Integer | seconds | Total call duration     | 101     | Yes   |
| duration_formatted | String  | MM:SS   | Human-readable duration | 01:41   | No    |

## Status Fields

| Field        | Type    | Values    | Description          | Example              | Null? |
| ------------ | ------- | --------- | -------------------- | -------------------- | ----- |
| status       | String  | See below | Current call status  | completed            | No    |
| status_code  | Integer | 0, 1, 2   | Numeric status code  | 1                    | No    |
| ended_reason | String  | See below | Reason call ended    | assistant-ended-call | Yes   |
| call_outcome | String  | See below | Calculated outcome   | Successful           | No    |
| outcome_code | Integer | 0, 1, 2   | Numeric outcome code | 2                    | No    |

### Status Values

| Value       | status_code | Description             |
| ----------- | ----------- | ----------------------- |
| completed   | 1           | Call completed normally |
| failed      | 0           | Call failed to complete |
| queued      | 2           | Waiting to be initiated |
| ringing     | 2           | Phone is ringing        |
| in-progress | 2           | Call is active          |

### Ended Reason Values

| Value                 | Description                          | Indicates                       |
| --------------------- | ------------------------------------ | ------------------------------- |
| assistant-ended-call  | AI assistant ended the call          | Normal completion               |
| customer-ended-call   | Customer hung up                     | Early termination or normal end |
| silence-timed-out     | No audio detected for timeout period | Voicemail or connectivity issue |
| dial-busy             | Phone line was busy                  | Retry recommended               |
| dial-no-answer        | No one answered                      | Retry recommended               |
| voicemail             | Voicemail detected                   | Retry recommended               |
| assistant-error       | Technical error in assistant         | System issue                    |
| exceeded-max-duration | Call hit max duration limit          | Cost control                    |

### Call Outcome Values

| Value      | outcome_code | Logic                                         | Success? |
| ---------- | ------------ | --------------------------------------------- | -------- |
| Successful | 2            | status=completed AND success_evaluation=true  | Yes      |
| Completed  | 1            | status=completed AND success_evaluation!=true | Partial  |
| Failed     | 0            | status=failed                                 | No       |
| Other      | 0            | Any other status                              | No       |

## Quality Metrics

| Field              | Type    | Values         | Description                    | Example | Null? |
| ------------------ | ------- | -------------- | ------------------------------ | ------- | ----- |
| user_sentiment     | String  | See below      | AI-detected customer sentiment | neutral | Yes   |
| sentiment_code     | Integer | -1 to 2        | Numeric sentiment code         | 1       | No    |
| success_evaluation | String  | "true"/"false" | AI success assessment          | true    | Yes   |
| success_flag       | Integer | 0 or 1         | Numeric success flag           | 1       | No    |

### Sentiment Values

| Value    | sentiment_code | Description                         |
| -------- | -------------- | ----------------------------------- |
| positive | 2              | Customer was pleased/satisfied      |
| neutral  | 1              | Customer was neutral/matter-of-fact |
| negative | 0              | Customer was upset/dissatisfied     |
| (null)   | -1             | Not analyzed or unknown             |

## Financial Metrics

| Field           | Type    | Precision  | Description            | Example | Null? |
| --------------- | ------- | ---------- | ---------------------- | ------- | ----- |
| cost            | Decimal | 4 decimals | Total call cost in USD | 0.9200  | Yes   |
| cost_per_minute | Decimal | 4 decimals | Cost per minute rate   | 0.5465  | No    |
| cumulative_cost | Decimal | 4 decimals | Running total of costs | 12.9300 | No    |

### Cost Calculation Notes

- Cost is charged by VAPI based on duration and AI model usage
- `cost_per_minute = cost / (duration_seconds / 60)`
- If `duration_seconds = 0`, then `cost_per_minute = 0.0000`
- `cumulative_cost` is calculated in chronological order (most recent first)

## Content Fields

| Field              | Type | Max Length  | Description                   | Example                           | Null? |
| ------------------ | ---- | ----------- | ----------------------------- | --------------------------------- | ----- |
| summary            | Text | 200 chars\* | AI-generated call summary     | "An assistant from Alum Rock..."  | Yes   |
| transcript         | Text | Unlimited   | Full conversation transcript  | (full transcript)                 | Yes   |
| transcript_preview | Text | 200 chars\* | First 200 chars of transcript | "AI: Hi. This is an assistant..." | Yes   |

\*Note: In comprehensive CSV, text is truncated to 200 characters. Full text available in database.

## Medical Context

| Field               | Type    | Format             | Description                  | Example                 | Null? |
| ------------------- | ------- | ------------------ | ---------------------------- | ----------------------- | ----- |
| condition_category  | Array   | JSON/semicolon-sep | Medical conditions discussed | dental; pain-management | Yes   |
| knowledge_base_used | Array   | JSON/semicolon-sep | Knowledge bases referenced   | dental; post-surgical   | Yes   |
| condition_count     | Integer | Count              | Number of conditions         | 2                       | No    |
| kb_count            | Integer | Count              | Number of knowledge bases    | 2                       | No    |

### Available Condition Categories

- behavioral
- cardiac
- dental
- dermatological
- endocrine
- gastrointestinal
- neurological
- ophthalmic
- orthopedic
- pain-management
- post-surgical
- respiratory
- urinary
- wound-care

## Recording Fields

| Field                | Type | Format | Description            | Example                                | Null? |
| -------------------- | ---- | ------ | ---------------------- | -------------------------------------- | ----- |
| recording_url        | URL  | HTTPS  | Mono audio recording   | https://storage.vapi.ai/.../mono.wav   | Yes   |
| stereo_recording_url | URL  | HTTPS  | Stereo audio recording | https://storage.vapi.ai/.../stereo.wav | Yes   |

### Recording Notes

- WAV format, 16-bit PCM
- Mono: Single channel, smaller file size
- Stereo: Separate channels for AI and customer
- URLs expire after 30 days (VAPI retention policy)
- Recording available after call completion

## Configuration Fields (Not Exported)

These fields exist in the database but are not included in CSV exports:

| Field               | Type   | Description               |
| ------------------- | ------ | ------------------------- |
| assistant_id        | String | VAPI assistant used       |
| phone_number_id     | String | VAPI phone number used    |
| dynamic_variables   | JSON   | Call-specific variables   |
| metadata            | JSON   | Additional metadata       |
| qstash_message_id   | String | QStash scheduling ID      |
| transcript_messages | JSON   | Structured message array  |
| call_analysis       | JSON   | Detailed AI analysis      |
| structured_data     | JSON   | Extracted structured data |

## Data Types Summary

| Type     | Description                      | Example                              |
| -------- | -------------------------------- | ------------------------------------ |
| UUID     | 36-character unique identifier   | acf02905-1ad9-488f-a147-e2063759472c |
| String   | Text data, variable length       | "completed"                          |
| Integer  | Whole number                     | 101                                  |
| Decimal  | Number with decimal places       | 0.9200                               |
| DateTime | ISO 8601 timestamp with timezone | 2025-12-07T03:00:36.853+00:00        |
| Date     | Date only (YYYY-MM-DD)           | 2025-12-07                           |
| Time     | Time only (HH:MM:SS)             | 02:59:25                             |
| Boolean  | true/false value                 | true                                 |
| Array    | List of values                   | ["dental", "post-surgical"]          |
| JSON     | Structured data object           | {"key": "value"}                     |
| URL      | Web address                      | https://example.com/file.wav         |

## Field Relationships

### Primary Keys

- `call_id` is the primary unique identifier

### Foreign Keys

- `case_id` → cases table
- `user_id` → users table (not exported)

### Derived Fields

Fields calculated from other fields:

```
call_date         ← created_at (date portion)
call_time         ← created_at (time portion)
day_name          ← created_at (day of week)
day_of_week_num   ← created_at (0-6)
hour_of_day       ← created_at (0-23)
area_code         ← customer_phone (chars 2-4)
duration_formatted ← duration_seconds (MM:SS)
day_type          ← day_of_week_num (Weekday/Weekend)
day_type_code     ← day_of_week_num (0/1)
time_category     ← hour_of_day + day_of_week_num
time_category_code ← hour_of_day + day_of_week_num (0/1)
call_outcome      ← status + success_evaluation
outcome_code      ← status + success_evaluation (0/1/2)
sentiment_code    ← user_sentiment (map to number)
success_flag      ← success_evaluation (0/1)
schedule_delay_minutes ← started_at - scheduled_for
cost_per_minute   ← cost / (duration_seconds / 60)
cumulative_cost   ← SUM(cost) running total
condition_count   ← COUNT(condition_category items)
kb_count          ← COUNT(knowledge_base_used items)
transcript_preview ← transcript (first 200 chars)
```

## Data Quality Rules

### Required Fields (Never Null)

- call_id
- vapi_call_id
- created_at
- scheduled_for
- customer_phone
- status

### Conditionally Required

- `started_at` required if status != "queued"
- `ended_at` required if status = "completed" or "failed"
- `duration_seconds` required if status = "completed"
- `ended_reason` required if status = "completed" or "failed"

### Valid Ranges

- `duration_seconds`: 0 to 1800 (30 minutes max)
- `cost`: 0.00 to 10.00 (typical range)
- `hour_of_day`: 0 to 23
- `day_of_week_num`: 0 to 6
- `schedule_delay_minutes`: typically -5 to +5

### Format Validation

- `customer_phone`: Must match E.164 format `+[country][number]`
- `area_code`: Must be 3 digits
- All URLs must be HTTPS
- All timestamps must be valid ISO 8601

## Export Differences

| Field               | Comprehensive CSV          | Pivot CSV                 |
| ------------------- | -------------------------- | ------------------------- |
| summary             | Truncated to 200 chars     | Not included              |
| transcript          | Not included (too large)   | Not included              |
| transcript_preview  | Truncated to 200 chars     | Not included              |
| condition_category  | Semicolon-separated string | Not included (only count) |
| knowledge_base_used | Semicolon-separated string | Not included (only count) |
| metadata            | Not included               | Not included              |
| day_name            | Full name (Saturday)       | Not included              |
| time_category       | Text (Business Hours)      | Numeric code (0/1)        |
| day_type            | Text (Weekday/Weekend)     | Numeric code (0/1)        |
| status              | Text (completed)           | Numeric code (0/1/2)      |
| call_outcome        | Text (Successful)          | Numeric code (0/1/2)      |
| user_sentiment      | Text (neutral)             | Numeric code (-1 to 2)    |
| success_evaluation  | Text (true/false)          | Numeric flag (0/1)        |

## Version History

**v1.0** - December 7, 2025

- Initial data dictionary
- 58 records from December 1-7, 2025
- 30 fields in comprehensive export
- 22 fields in pivot export
