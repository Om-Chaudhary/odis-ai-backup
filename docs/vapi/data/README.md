# VAPI Calls Data Spreadsheets

Professional spreadsheet exports for VAPI scheduled discharge calls analysis.

## Files Overview

### 1. vapi_calls_comprehensive_spreadsheet.csv

**Location**: `../spreadsheet-generation/vapi_calls_comprehensive_spreadsheet.csv`  
**Purpose**: Complete data export with all fields for detailed analysis and reporting  
**Size**: ~55KB (58 records)  
**Format**: Excel/Google Sheets compatible CSV

### 2. vapi_calls_pivot_ready.csv

**Location**: `../spreadsheet-generation/vapi_calls_pivot_ready.csv`  
**Purpose**: Optimized for pivot tables and statistical analysis  
**Size**: ~12KB (58 records)  
**Format**: Numeric codes and simplified structure

## Data Period

**Date Range**: December 1-7, 2025
**Total Records**: 58 calls
**Unique Customers**: 53
**Success Rate**: 44.83%

## Comprehensive Spreadsheet

### File Structure

The comprehensive CSV contains:

- **Title Section** (Rows 1-3): Header with analysis name and date range
- **Data Section** (Rows 4+): 30 columns with complete call information
- **Summary Section** (Bottom): Key performance statistics

### Column Reference

#### Section A: Core Information (Columns 1-8)

| Column | Name          | Description                   | Example                              |
| ------ | ------------- | ----------------------------- | ------------------------------------ |
| A      | call_id       | Unique call identifier (UUID) | acf02905-1ad9-488f-a147-e2063759472c |
| B      | vapi_call_id  | VAPI platform call ID         | 019af6c0-dad4-7881-b6d5-59042c83c5bc |
| C      | case_id       | Associated case UUID          | ef26e69d-5493-4ec5-be16-3d3950800664 |
| D      | call_date     | Call date (YYYY-MM-DD)        | 2025-12-07                           |
| E      | call_time     | Call time (HH:MM:SS)          | 02:59:25                             |
| F      | day_name      | Day of week                   | Saturday                             |
| G      | time_category | Business Hours or After Hours | After Hours                          |
| H      | day_type      | Weekday or Weekend            | Weekend                              |

#### Section B: Contact & Duration (Columns 9-15)

| Column | Name               | Description                     | Example                       |
| ------ | ------------------ | ------------------------------- | ----------------------------- |
| I      | customer_phone     | Phone number (E.164 format)     | +14084254890                  |
| J      | area_code          | Extracted 3-digit area code     | 408                           |
| K      | duration_seconds   | Call length in seconds          | 101                           |
| L      | duration_formatted | Human-readable duration (MM:SS) | 01:41                         |
| M      | scheduled_for      | ISO 8601 scheduled time         | 2025-12-07T03:00:25.648+00:00 |
| N      | started_at         | ISO 8601 actual start time      | 2025-12-07T03:00:36.853+00:00 |
| O      | ended_at           | ISO 8601 end time               | 2025-12-07T03:02:18.557+00:00 |

#### Section C: Status & Quality (Columns 16-21)

| Column | Name                   | Description                                | Example              |
| ------ | ---------------------- | ------------------------------------------ | -------------------- |
| P      | status                 | Call completion status                     | completed            |
| Q      | ended_reason           | Why call ended                             | assistant-ended-call |
| R      | call_outcome           | Calculated outcome                         | Successful           |
| S      | user_sentiment         | Sentiment analysis                         | neutral              |
| T      | success_evaluation     | Boolean success flag                       | true                 |
| U      | schedule_delay_minutes | Minutes between scheduled and actual start | 0.19                 |

#### Section D: Financial (Columns 22-24)

| Column | Name            | Description                   | Example |
| ------ | --------------- | ----------------------------- | ------- |
| V      | cost            | Call cost in USD (4 decimals) | 0.9200  |
| W      | cost_per_minute | Cost per minute rate          | 0.5465  |
| X      | cumulative_cost | Running total of costs        | 0.9200  |

#### Section E: Content (Columns 25-28)

| Column | Name                | Description                               | Example                         |
| ------ | ------------------- | ----------------------------------------- | ------------------------------- |
| Y      | condition_category  | Medical conditions (semicolon-separated)  | dental; pain-management         |
| Z      | knowledge_base_used | Knowledge bases referenced                | dental; post-surgical           |
| AA     | summary             | AI-generated call summary (200 chars max) | An assistant from Alum Rock...  |
| AB     | transcript_preview  | First 200 chars of transcript             | AI: Hi. This is an assistant... |

#### Section F: Links (Columns 29-30)

| Column | Name                 | Description                | Example                               |
| ------ | -------------------- | -------------------------- | ------------------------------------- |
| AC     | recording_url        | Mono audio recording URL   | https://storage.vapi.ai/...mono.wav   |
| AD     | stereo_recording_url | Stereo audio recording URL | https://storage.vapi.ai/...stereo.wav |

### Summary Statistics

Located at the bottom of the file after blank rows:

| Metric                     | Value      |
| -------------------------- | ---------- |
| Total Calls                | 58         |
| Unique Customers           | 53         |
| Successful Calls           | 26         |
| Success Rate (%)           | 44.83      |
| Average Duration (seconds) | 55.12      |
| Total Cost ($)             | 12.9300    |
| Average Cost per Call ($)  | 0.2229     |
| Peak Day                   | 2025-12-06 |
| Peak Hour                  | 16 (4 PM)  |
| Most Common Area Code      | 408        |

### Use Cases

1. **Executive Reporting**: Import into PowerPoint/Keynote for presentations
2. **Detailed Analysis**: Full text search on summaries and transcripts
3. **Quality Review**: Filter by sentiment and success evaluation
4. **Financial Tracking**: Cumulative cost column shows spending trends
5. **Customer Service**: Review specific call recordings via URLs

## Pivot-Ready Spreadsheet

### File Structure

Optimized structure with numeric codes for easy pivoting and aggregation.

### Column Reference

| Column | Name               | Type   | Description                                   | Values               |
| ------ | ------------------ | ------ | --------------------------------------------- | -------------------- |
| 1      | call_id            | Text   | UUID identifier                               | UUID string          |
| 2      | vapi_call_id       | Text   | VAPI platform ID                              | VAPI ID              |
| 3      | case_id            | Text   | Case UUID                                     | UUID string          |
| 4      | call_date          | Date   | YYYY-MM-DD format                             | 2025-12-07           |
| 5      | call_time          | Time   | HH:MM:SS format                               | 02:59:25             |
| 6      | day_of_week        | Number | 0=Sunday, 6=Saturday                          | 0-6                  |
| 7      | day_type_code      | Number | 1=Weekday, 0=Weekend                          | 0 or 1               |
| 8      | hour_of_day        | Number | Hour (24-hour format)                         | 0-23                 |
| 9      | time_category_code | Number | 1=Business Hours, 0=After Hours               | 0 or 1               |
| 10     | customer_phone     | Text   | E.164 phone number                            | +14084254890         |
| 11     | area_code          | Text   | 3-digit area code                             | 408                  |
| 12     | duration_seconds   | Number | Call duration                                 | 101                  |
| 13     | status_code        | Number | 1=completed, 0=failed, 2=other                | 0, 1, or 2           |
| 14     | ended_reason       | Text   | End reason string                             | assistant-ended-call |
| 15     | outcome_code       | Number | 2=Successful, 1=Completed, 0=Other            | 0, 1, or 2           |
| 16     | sentiment_code     | Number | 2=positive, 1=neutral, 0=negative, -1=unknown | -1 to 2              |
| 17     | success_flag       | Number | 1=success, 0=not success                      | 0 or 1               |
| 18     | schedule_delay_min | Number | Minutes delayed from schedule                 | 0.19                 |
| 19     | cost               | Number | Cost in dollars (4 decimals)                  | 0.9200               |
| 20     | cost_per_min       | Number | Cost per minute rate                          | 0.5465               |
| 21     | condition_count    | Number | Number of conditions mentioned                | 0-5                  |
| 22     | kb_count           | Number | Number of knowledge bases used                | 0-3                  |

### Numeric Code Reference

#### day_of_week (Column 6)

- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

#### day_type_code (Column 7)

- `1` = Weekday (Monday-Friday)
- `0` = Weekend (Saturday-Sunday)

#### time_category_code (Column 9)

- `1` = Business Hours (9 AM - 5 PM, Weekdays)
- `0` = After Hours (All other times)

#### status_code (Column 13)

- `1` = completed
- `0` = failed
- `2` = other (queued, in-progress, etc.)

#### outcome_code (Column 15)

- `2` = Successful (completed + success_evaluation=true)
- `1` = Completed (completed but success_evaluation=false)
- `0` = Other (failed or other status)

#### sentiment_code (Column 16)

- `2` = positive
- `1` = neutral
- `0` = negative
- `-1` = unknown/not analyzed

#### success_flag (Column 17)

- `1` = Success (success_evaluation=true)
- `0` = Not Success (success_evaluation=false or null)

### Use Cases

1. **Pivot Tables**: Create multi-dimensional analysis by day, hour, outcome
2. **Charts & Graphs**: Plot success rates by time of day, day of week
3. **Statistical Analysis**: Calculate correlations, trends, patterns
4. **Business Intelligence**: Import into BI tools (Tableau, Power BI, Looker)
5. **Performance Metrics**: Track success rates, costs, and efficiency

### Sample Pivot Table Examples

#### Success Rate by Time Category

```
Rows: time_category_code (1=Business, 0=After Hours)
Values: Average(success_flag)
```

#### Call Volume by Day of Week

```
Rows: day_of_week
Values: Count(call_id)
```

#### Cost Analysis by Outcome

```
Rows: outcome_code (2=Successful, 1=Completed, 0=Other)
Values: Sum(cost), Average(cost), Count(call_id)
```

#### Hourly Performance

```
Rows: hour_of_day
Values: Count(call_id), Average(duration_seconds), Average(success_flag)
```

## Data Quality Notes

### Completeness

- All 58 records have complete core fields (IDs, dates, status)
- Some records may have empty condition_category or knowledge_base_used
- Recording URLs available for all completed calls

### Accuracy

- Dates and times in UTC timezone
- Phone numbers validated and formatted to E.164 standard
- Costs accurate to 4 decimal places
- Duration calculated from actual start/end timestamps

### Calculations

#### schedule_delay_minutes

```
(started_at - scheduled_for) / 60000 milliseconds
```

#### cost_per_minute

```
cost / (duration_seconds / 60)
```

Returns 0.0000 if duration is 0

#### cumulative_cost

Running total of costs in chronological order (most recent first in comprehensive CSV)

#### condition_count

Count of items in condition_category array (split by semicolon)

#### kb_count

Count of items in knowledge_base_used array (split by semicolon)

## Import Instructions

### Excel

1. Open Excel
2. File > Import > CSV
3. Select file
4. Choose delimiter: Comma
5. Set column types (Text for IDs, Date for dates, Number for numeric fields)
6. Import

### Google Sheets

1. Open Google Sheets
2. File > Import
3. Upload tab > Select file
4. Import location: New spreadsheet
5. Separator type: Comma
6. Click "Import data"

### Python (pandas)

```python
import pandas as pd

# Comprehensive spreadsheet
df_full = pd.read_csv('../spreadsheet-generation/vapi_calls_comprehensive_spreadsheet.csv', skiprows=3)

# Pivot-ready spreadsheet
df_pivot = pd.read_csv('../spreadsheet-generation/vapi_calls_pivot_ready.csv')
df_pivot['call_date'] = pd.to_datetime(df_pivot['call_date'])
```

### R

```r
# Comprehensive spreadsheet
df_full <- read.csv('../spreadsheet-generation/vapi_calls_comprehensive_spreadsheet.csv', skip=3)

# Pivot-ready spreadsheet
df_pivot <- read.csv('../spreadsheet-generation/vapi_calls_pivot_ready.csv')
df_pivot$call_date <- as.Date(df_pivot$call_date)
```

## Analysis Tips

### Finding High-Value Insights

1. **Success Patterns**: Filter pivot CSV by `success_flag=1` and analyze:
   - Most common `hour_of_day`
   - Average `duration_seconds`
   - `day_type_code` distribution

2. **Cost Optimization**:
   - Compare `cost_per_min` across `outcome_code`
   - Identify expensive low-success calls

3. **Customer Engagement**:
   - Group by `area_code` to find geographic patterns
   - Analyze `duration_seconds` vs `success_flag` correlation

4. **Operational Efficiency**:
   - Track `schedule_delay_min` trends
   - Monitor `ended_reason` distribution

### Common Filters

**Successful Calls Only**:

```
Comprehensive: call_outcome = "Successful"
Pivot: outcome_code = 2
```

**Business Hours**:

```
Comprehensive: time_category = "Business Hours"
Pivot: time_category_code = 1
```

**High-Cost Calls** (>$0.50):

```
cost > 0.5
```

**Long Calls** (>2 minutes):

```
Comprehensive: duration_seconds > 120
Pivot: duration_seconds > 120
```

## Maintenance

### Regeneration

To regenerate these spreadsheets with fresh data:

```bash
# 1. Extract data from database
node -e "..." > /tmp/vapi_clean_final.json

# 2. Run generation script
node scripts/generate_vapi_spreadsheet.cjs
```

### Data Freshness

- Current data: December 1-7, 2025
- Last generated: December 7, 2025
- Generator script: `/scripts/generate_vapi_spreadsheet.cjs`

## Support

For questions or issues with these spreadsheets:

1. Check column reference tables above
2. Review data quality notes
3. Verify import instructions for your tool
4. Consult sample pivot table examples

## Change Log

**2025-12-07** - Initial creation

- Created comprehensive spreadsheet with 30 columns
- Created pivot-ready spreadsheet with 22 coded columns
- Added comprehensive README documentation
- Total records: 58 calls from December 1-7, 2025
