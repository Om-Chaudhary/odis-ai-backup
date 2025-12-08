# VAPI Call Data - Field Reference Guide

Complete reference for all fields in the VAPI call dataset. Use this when analyzing the CSV files or understanding the data structure.

## Core Identifiers

### call_id

- **Type**: UUID (string)
- **Format**: `acf02905-1ad9-488f-a147-e2063759472c`
- **Description**: Unique identifier for the call record in our database
- **Always Present**: Yes
- **Example**: `acf02905-1ad9-488f-a147-e2063759472c`

### vapi_call_id

- **Type**: String
- **Format**: VAPI platform identifier
- **Description**: Unique identifier from VAPI platform
- **Always Present**: Yes (except failed calls)
- **Example**: `019af6c0-dad4-7881-b6d5-59042c83c5bc`

### case_id

- **Type**: UUID (string)
- **Format**: `ef26e69d-5493-4ec5-be16-3d3950800664`
- **Description**: Links to the veterinary case/appointment
- **Always Present**: Usually yes
- **Example**: `ef26e69d-5493-4ec5-be16-3d3950800664`

## Temporal Fields

### call_date

- **Type**: Date
- **Format**: `YYYY-MM-DD`
- **Description**: Date portion of when call was created/scheduled
- **Always Present**: Yes
- **Example**: `2025-12-07`

### call_time

- **Type**: Time
- **Format**: `HH:MM:SS` (24-hour)
- **Description**: Time portion of when call was created
- **Always Present**: Yes
- **Example**: `02:59:25`

### scheduled_for

- **Type**: DateTime
- **Format**: ISO 8601 with timezone
- **Description**: When the call was scheduled to execute
- **Always Present**: Yes
- **Example**: `2025-12-07T03:00:25.648+00:00`

### started_at

- **Type**: DateTime
- **Format**: ISO 8601 with timezone
- **Description**: When the call actually started (phone began ringing)
- **Always Present**: No (null if call never started)
- **Example**: `2025-12-07T03:00:36.853+00:00`

### ended_at

- **Type**: DateTime
- **Format**: ISO 8601 with timezone
- **Description**: When the call ended
- **Always Present**: No (null if call never completed)
- **Example**: `2025-12-07T03:02:18.557+00:00`

## Derived Temporal Fields

### day_name

- **Type**: String
- **Values**: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`
- **Description**: Full name of day of week
- **Always Present**: Yes
- **Example**: `Saturday`

### day_of_week_num

- **Type**: Integer
- **Values**: `0` (Sunday) through `6` (Saturday)
- **Description**: Numeric day of week for calculations
- **Always Present**: Yes
- **Example**: `6`

### hour_of_day

- **Type**: Integer
- **Values**: `0` through `23`
- **Description**: Hour in 24-hour format
- **Always Present**: Yes
- **Example**: `18` (6 PM)

### day_type

- **Type**: String
- **Values**: `Weekday`, `Weekend`
- **Description**: Whether call occurred on weekday or weekend
- **Always Present**: Yes
- **Example**: `Weekend`

### day_type_code

- **Type**: Integer
- **Values**: `1` (Weekday), `0` (Weekend)
- **Description**: Numeric code for day type
- **Always Present**: Yes
- **Example**: `0`

### time_category

- **Type**: String
- **Values**: `Business Hours`, `After Hours`
- **Description**: Whether call occurred during business hours (Mon-Fri, 9 AM - 5 PM)
- **Always Present**: Yes
- **Example**: `After Hours`

### time_category_code

- **Type**: Integer
- **Values**: `1` (Business Hours), `0` (After Hours)
- **Description**: Numeric code for time category
- **Always Present**: Yes
- **Example**: `0`

### schedule_delay_minutes

- **Type**: Decimal
- **Format**: Minutes with 2 decimal places
- **Description**: Delay between scheduled time and actual start time
- **Calculation**: `(started_at - scheduled_for) / 60000`
- **Always Present**: No (null if call never started)
- **Example**: `0.19` (11 seconds delay)

## Contact Information

### customer_phone

- **Type**: String
- **Format**: E.164 international format
- **Description**: Phone number called (with country code)
- **Always Present**: Yes
- **Example**: `+14084254890`

### area_code

- **Type**: String
- **Format**: 3 digits
- **Description**: Extracted area code from phone number
- **Always Present**: Usually yes
- **Example**: `408`

## Call Metrics

### duration_seconds

- **Type**: Integer
- **Unit**: Seconds
- **Description**: Total call duration in seconds
- **Calculation**: `(ended_at - started_at) / 1000`
- **Always Present**: No (null if call never completed)
- **Example**: `101`

### duration_formatted

- **Type**: String
- **Format**: `MM:SS`
- **Description**: Human-readable duration
- **Always Present**: Yes (shows "N/A" if no duration)
- **Example**: `01:41`

## Status Fields

### status

- **Type**: String
- **Values**:
  - `completed` - Call finished normally
  - `failed` - Call failed to complete
  - `queued` - Waiting to be executed
  - `ringing` - Phone is ringing
  - `in-progress` - Call is active
- **Description**: Current state of the call
- **Always Present**: Yes
- **Example**: `completed`

### status_code

- **Type**: Integer
- **Values**:
  - `1` - completed
  - `0` - failed
  - `2` - queued/ringing/in-progress
- **Description**: Numeric code for status
- **Always Present**: Yes
- **Example**: `1`

### ended_reason

- **Type**: String
- **Values**:
  - `assistant-ended-call` - AI completed conversation
  - `customer-ended-call` - Owner hung up
  - `silence-timed-out` - No audio detected
  - `assistant-forwarded-call` - Transferred to clinic
  - `dial-busy` - Line was busy
  - `dial-no-answer` - No answer
  - `voicemail` - Voicemail detected
  - `assistant-error` - Technical error
  - `exceeded-max-duration` - Hit time limit
  - `call.in-progress.error-sip-outbound-call-failed-to-connect` - Connection failed
- **Description**: Why the call ended
- **Always Present**: No (null if call never ended)
- **Example**: `assistant-ended-call`

### call_outcome

- **Type**: String
- **Values**:
  - `Successful` - status=completed AND success_evaluation=true
  - `Completed` - status=completed BUT success_evaluation!=true
  - `Failed` - status=failed
  - `Other` - Any other status
- **Description**: Calculated outcome category
- **Always Present**: Yes
- **Example**: `Successful`

### outcome_code

- **Type**: Integer
- **Values**:
  - `2` - Successful
  - `1` - Completed
  - `0` - Failed/Other
- **Description**: Numeric code for outcome
- **Always Present**: Yes
- **Example**: `2`

## Quality Metrics

### user_sentiment

- **Type**: String
- **Values**: `positive`, `neutral`, `negative`, or `null`
- **Description**: AI-detected customer sentiment during call
- **Always Present**: No (null if not analyzed)
- **Example**: `neutral`

### sentiment_code

- **Type**: Integer
- **Values**:
  - `2` - positive
  - `1` - neutral
  - `0` - negative
  - `-1` - unknown/not analyzed
- **Description**: Numeric code for sentiment
- **Always Present**: Yes
- **Example**: `1`

### success_evaluation

- **Type**: String
- **Values**: `"true"`, `"false"`, or `null`
- **Description**: **MANUAL HUMAN EVALUATION** - Whether call achieved its goals
- **Evaluation Process**:
  - Human reviewers listen to recordings/read transcripts
  - Only evaluates calls where user actually picked up
  - Excludes voicemail false positives
  - Marks `true` if call achieved goals, `false` otherwise
- **Always Present**: No (null if not evaluated)
- **Example**: `"true"`

### success_flag

- **Type**: Integer
- **Values**: `1` (true), `0` (false or null)
- **Description**: Numeric flag for success_evaluation
- **Always Present**: Yes
- **Example**: `1`

## Financial Metrics

### cost

- **Type**: Decimal
- **Format**: USD with 4 decimal places
- **Description**: Total cost of the call in US dollars
- **Always Present**: No (null if call never started)
- **Example**: `0.9200`

### cost_per_minute

- **Type**: Decimal
- **Format**: USD with 4 decimal places
- **Description**: Cost per minute rate
- **Calculation**: `cost / (duration_seconds / 60)`
- **Always Present**: Yes (shows `0.0000` if duration is 0)
- **Example**: `0.5465`

### cumulative_cost

- **Type**: Decimal
- **Format**: USD with 4 decimal places
- **Description**: Running total of costs (chronological order)
- **Always Present**: Yes
- **Example**: `12.9300`

## Content Fields

### summary

- **Type**: Text
- **Max Length**: 200 characters (truncated in CSV)
- **Description**: AI-generated summary of the call conversation
- **Always Present**: No (null for very short or failed calls)
- **Example**: `"An assistant from Alum Rock Animal Hospital called to follow up on Button's recent appointment..."`

### transcript_preview

- **Type**: Text
- **Max Length**: 200 characters (truncated in CSV)
- **Description**: First 200 characters of full transcript
- **Always Present**: No (null if no transcript)
- **Example**: `"AI: Hi. This is an assistant calling from Alum Rock Animal Hospital..."`

### transcript

- **Type**: Text (unlimited length)
- **Description**: Full conversation transcript
- **Format**:
  ```
  AI: [AI message]
  User: [User message]
  ```
- **Always Present**: No (not included in CSV, available in database)
- **Note**: Full transcript available in database, only preview in CSV

## Medical Context Fields

### condition_category

- **Type**: Array/String
- **Format**: Semicolon-separated in CSV: `"dental; pain-management"`
- **Description**: Medical conditions discussed during call
- **Available Values**:
  - `behavioral`, `cardiac`, `dental`, `dermatological`, `endocrine`
  - `gastrointestinal`, `neurological`, `ophthalmic`, `orthopedic`
  - `pain-management`, `post-surgical`, `respiratory`, `urinary`, `wound-care`
- **Always Present**: No (currently 0% populated - not implemented)
- **Example**: `"dental; pain-management"`

### knowledge_base_used

- **Type**: Array/String
- **Format**: Semicolon-separated in CSV: `"dental; post-surgical"`
- **Description**: Which knowledge bases the AI referenced during call
- **Always Present**: No (currently 0% populated - not tracked)
- **Example**: `"dental; post-surgical"`

### condition_count

- **Type**: Integer
- **Description**: Number of condition categories (count of items in condition_category)
- **Calculation**: `condition_category.split(';').length`
- **Always Present**: Yes
- **Example**: `2`

### kb_count

- **Type**: Integer
- **Description**: Number of knowledge bases used (count of items in knowledge_base_used)
- **Calculation**: `knowledge_base_used.split(';').length`
- **Always Present**: Yes
- **Example**: `2`

## Recording Fields

### recording_url

- **Type**: URL
- **Format**: HTTPS URL to WAV file
- **Description**: Link to mono audio recording
- **Format Details**: WAV, 16-bit PCM, single channel
- **Retention**: 30 days from VAPI
- **Always Present**: No (null if call failed or very short)
- **Example**: `https://storage.vapi.ai/019af6c0-dad4-7881-b6d5-59042c83c5bc-1765076541166-3eb1d225-e593-46e3-bb0d-59bc8257d135-mono.wav`

### stereo_recording_url

- **Type**: URL
- **Format**: HTTPS URL to WAV file
- **Description**: Link to stereo audio recording (separate channels for AI and customer)
- **Format Details**: WAV, 16-bit PCM, dual channel
- **Retention**: 30 days from VAPI
- **Always Present**: No (null if call failed or very short)
- **Example**: `https://storage.vapi.ai/019af6c0-dad4-7881-b6d5-59042c83c5bc-1765076541166-f2df279d-d4bd-4c99-bb23-d7e4e42fd0cc-stereo.wav`

## Field Relationships

### Primary Key

- `call_id` - Unique identifier for each record

### Foreign Keys

- `case_id` → Links to veterinary case/appointment
- `vapi_call_id` → Links to VAPI platform record

### Calculated Fields

These fields are derived from other fields:

```
call_date              ← created_at (date portion)
call_time              ← created_at (time portion)
day_name               ← created_at (day of week)
day_of_week_num        ← created_at (0-6)
hour_of_day            ← created_at (0-23)
area_code              ← customer_phone (extract 3 digits)
duration_formatted     ← duration_seconds (MM:SS format)
day_type               ← day_of_week_num (Weekday/Weekend)
day_type_code          ← day_type (1/0)
time_category          ← hour_of_day + day_of_week_num
time_category_code     ← time_category (1/0)
call_outcome           ← status + success_evaluation
outcome_code           ← call_outcome (2/1/0)
sentiment_code         ← user_sentiment (2/1/0/-1)
success_flag           ← success_evaluation (1/0)
schedule_delay_minutes ← started_at - scheduled_for
cost_per_minute        ← cost / (duration_seconds / 60)
cumulative_cost        ← SUM(cost) running total
condition_count        ← COUNT(condition_category items)
kb_count              ← COUNT(knowledge_base_used items)
transcript_preview     ← transcript (first 200 chars)
```

## Data Quality Rules

### Required Fields (Never Null)

- `call_id`
- `vapi_call_id` (except failed calls)
- `created_at`
- `scheduled_for`
- `customer_phone`
- `status`

### Conditionally Required

- `started_at` - Required if `status != "queued"`
- `ended_at` - Required if `status = "completed"` or `"failed"`
- `duration_seconds` - Required if `status = "completed"`
- `ended_reason` - Required if `status = "completed"` or `"failed"`

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

---

**Last Updated**: December 8, 2025  
**Dataset**: December 1-7, 2025  
**Total Fields**: 30+ in comprehensive CSV, 22 in pivot CSV
