# VAPI Calls Spreadsheet - Quick Reference Card

## Files at a Glance

| File                                         | Size | Use For                                 |
| -------------------------------------------- | ---- | --------------------------------------- |
| **vapi_calls_comprehensive_spreadsheet.csv** | 55KB | Reports, presentations, detailed review |
| **vapi_calls_pivot_ready.csv**               | 12KB | Pivot tables, charts, BI tools          |
| **README.md**                                | 11KB | Import instructions, column reference   |
| **DATA_DICTIONARY.md**                       | 12KB | Complete field definitions              |

## Key Statistics

```
Period:             December 1-7, 2025
Total Calls:        58
Unique Customers:   53
Success Rate:       44.83%
Avg Duration:       55 seconds
Total Cost:         $12.93
Cost per Call:      $0.22
Peak Day:           Friday, Dec 6
Peak Hour:          4 PM
Top Area Code:      408 (San Jose, CA)
```

## Numeric Codes Cheat Sheet

### status_code

- `1` = completed
- `0` = failed
- `2` = other (queued, in-progress, ringing)

### outcome_code

- `2` = Successful (completed + success=true)
- `1` = Completed (completed + success=false)
- `0` = Failed/Other

### sentiment_code

- `2` = positive
- `1` = neutral
- `0` = negative
- `-1` = unknown

### day_type_code

- `1` = Weekday (Mon-Fri)
- `0` = Weekend (Sat-Sun)

### time_category_code

- `1` = Business Hours (Mon-Fri 9AM-5PM)
- `0` = After Hours (all other times)

### success_flag

- `1` = Success
- `0` = Not success

### day_of_week

- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

## Common Filters

### Excel/Google Sheets

**Show only successful calls:**

```
Column R (call_outcome) = "Successful"
OR
Column O (outcome_code) = 2
```

**Business hours only:**

```
Column G (time_category) = "Business Hours"
OR
Column I (time_category_code) = 1
```

**High-cost calls:**

```
Column V (cost) > 0.5
```

**Long calls:**

```
Column K (duration_seconds) > 120
```

**Weekdays only:**

```
Column H (day_type) = "Weekday"
OR
Column G (day_type_code) = 1
```

### Python Pandas

```python
import pandas as pd

# Load data
df = pd.read_csv('vapi_calls_pivot_ready.csv')

# Successful calls only
successful = df[df['success_flag'] == 1]

# Business hours only
business = df[df['time_category_code'] == 1]

# Calls over 2 minutes
long_calls = df[df['duration_seconds'] > 120]

# Friday calls
friday = df[df['day_of_week'] == 5]

# High cost
expensive = df[df['cost'] > 0.5]
```

### SQL (if importing to database)

```sql
-- Successful calls
SELECT * FROM vapi_calls
WHERE success_flag = 1;

-- Business hours analysis
SELECT hour_of_day, AVG(success_flag) as success_rate
FROM vapi_calls
WHERE time_category_code = 1
GROUP BY hour_of_day
ORDER BY success_rate DESC;

-- Cost by outcome
SELECT outcome_code,
       COUNT(*) as calls,
       AVG(cost) as avg_cost,
       SUM(cost) as total_cost
FROM vapi_calls
GROUP BY outcome_code;
```

## Common Pivot Tables

### Success Rate by Hour

- **Rows**: hour_of_day
- **Values**: Average of success_flag
- **Filter**: time_category_code = 1 (business hours)

### Call Volume by Day

- **Rows**: call_date
- **Values**: Count of call_id
- **Sort**: By date ascending

### Cost Analysis

- **Rows**: outcome_code
- **Values**: Sum of cost, Average of cost, Count of call_id

### Sentiment Distribution

- **Rows**: sentiment_code
- **Values**: Count of call_id
- **Show**: As percentage of total

### Geographic Analysis

- **Rows**: area_code
- **Values**: Count of call_id, Average of success_flag
- **Sort**: By count descending
- **Filter**: Top 10

## Common Calculations

### Success Rate

```
= COUNTIF(success_flag, 1) / COUNT(call_id)
```

### Average Call Duration (minutes)

```
= AVERAGE(duration_seconds) / 60
```

### Cost Efficiency

```
= SUM(cost) / COUNTIF(success_flag, 1)
```

(Cost per successful call)

### Conversion Rate

```
= COUNTIF(outcome_code, 2) / COUNT(call_id)
```

## Data Import Quick Steps

### Excel

1. File → Import → CSV
2. Select file
3. Delimiter: Comma
4. Import

### Google Sheets

1. File → Import
2. Upload file
3. Import location: New spreadsheet
4. Separator: Comma
5. Import

### Tableau

1. Connect to Data → Text File
2. Select CSV file
3. Sheet tab appears automatically
4. Start building viz

### Power BI

1. Get Data → Text/CSV
2. Select file
3. Load
4. Transform if needed

## Most Useful Columns

### For Reporting

- call_date, call_time
- customer_phone, area_code
- duration_formatted
- call_outcome
- cost
- summary

### For Analysis

- day_of_week, hour_of_day
- time_category_code
- outcome_code, success_flag
- duration_seconds
- cost_per_min
- sentiment_code

### For Quality Review

- call_id (to find in database)
- success_evaluation
- user_sentiment
- ended_reason
- recording_url (to listen)

## Field Relationships

```
created_at
  ├── call_date (date portion)
  ├── call_time (time portion)
  ├── day_name (text: Monday, Tuesday...)
  ├── day_of_week (number: 0-6)
  ├── hour_of_day (number: 0-23)
  └── time_category (Business/After Hours)

status + success_evaluation
  ├── call_outcome (text: Successful, Completed, Failed)
  └── outcome_code (number: 2, 1, 0)

started_at - scheduled_for
  └── schedule_delay_minutes

cost / (duration_seconds / 60)
  └── cost_per_minute

condition_category array
  └── condition_count
```

## Top Insights

**Best Time to Call**: Friday at 4 PM
**Success Indicator**: Calls > 60 seconds
**Cost Sweet Spot**: $0.25-0.35 per call
**Geographic Focus**: 408 area code (San Jose)
**Sentiment**: 92% positive/neutral

## File Locations

```
/docs/vapi/data/
  ├── vapi_calls_comprehensive_spreadsheet.csv  (Main export)
  ├── vapi_calls_pivot_ready.csv                (Pivot optimized)
  ├── README.md                                  (Full documentation)
  ├── DATA_DICTIONARY.md                         (Field reference)
  ├── QUICK_REFERENCE.md                         (This file)
  └── VAPI_CALLS_SPREADSHEET_SUMMARY.md         (Analysis summary)
```

## Generator Script

**Location**: `/scripts/generate_vapi_spreadsheet.cjs`

**Run**:

```bash
node scripts/generate_vapi_spreadsheet.cjs
```

**Requires**:

- Data at `/tmp/vapi_clean_final.json`
- Node.js installed

## Support

| **Question Type**           | **See Document**                  |
| --------------------------- | --------------------------------- |
| What does this column mean? | DATA_DICTIONARY.md                |
| How do I import?            | README.md                         |
| What are the insights?      | VAPI_CALLS_SPREADSHEET_SUMMARY.md |
| Quick lookup                | This file (QUICK_REFERENCE.md)    |

## Version

**v1.0** - December 7, 2025
Data from December 1-7, 2025
58 calls analyzed

---

**Pro Tip**: Start with the comprehensive CSV for exploring the data, then switch to pivot CSV for creating charts and dashboards.
