# VAPI Call Data - Sample Analysis Queries

This document provides sample queries and analysis patterns for working with the extracted VAPI call data.

## Data Files Available

- **vapi_calls_data.json** - Complete dataset with all fields
- **vapi_calls_filtered.csv** - Spreadsheet-compatible format
- **vapi_calls_analysis.md** - Pre-generated analysis report

## JavaScript/Node.js Examples

### Load and Filter Data

```javascript
import { readFileSync } from "fs";

// Load the data
const data = JSON.parse(
  readFileSync("docs/vapi/data/vapi_calls_data.json", "utf8"),
);

// Get all completed calls
const completedCalls = data.calls.filter((call) => call.status === "completed");
console.log(`Completed calls: ${completedCalls.length}`);

// Get calls by area code
const siliconValleyCalls = data.calls.filter((call) =>
  ["408", "650", "415"].includes(call.area_code),
);

// Get business hours calls only
const businessHoursCalls = data.calls.filter((call) => call.is_business_hours);

// Get weekend calls
const weekendCalls = data.calls.filter((call) => call.is_weekend);
```

### Calculate Custom Statistics

```javascript
// Average duration by status
const avgDurationByStatus = {};
const statuses = [...new Set(data.calls.map((c) => c.status))];

statuses.forEach((status) => {
  const statusCalls = data.calls.filter((c) => c.status === status);
  const totalDuration = statusCalls.reduce(
    (sum, c) => sum + (c.duration_seconds || 0),
    0,
  );
  avgDurationByStatus[status] =
    statusCalls.length > 0
      ? (totalDuration / statusCalls.length).toFixed(2)
      : 0;
});

console.log("Average Duration by Status:", avgDurationByStatus);

// Cost per successful call
const successfulCalls = data.calls.filter((c) => c.success_evaluation === true);
const totalCostSuccessful = successfulCalls.reduce(
  (sum, c) => sum + parseFloat(c.cost || 0),
  0,
);
const avgCostSuccessful = (
  totalCostSuccessful / successfulCalls.length
).toFixed(4);

console.log(`Average cost per successful call: $${avgCostSuccessful}`);
```

### Time-based Analysis

```javascript
// Calls per hour distribution
const callsByHour = {};
for (let hour = 0; hour < 24; hour++) {
  callsByHour[hour] = data.calls.filter((c) => c.hour_of_day === hour).length;
}

console.log("Calls by Hour:", callsByHour);

// Busiest day of week
const callsByDay = data.aggregations.by_day;
const busiestDay = Object.entries(callsByDay).sort(([, a], [, b]) => b - a)[0];

console.log(`Busiest day: ${busiestDay[0]} with ${busiestDay[1]} calls`);
```

### Find Anomalies

```javascript
// Find expensive calls
const costThreshold = 0.5;
const expensiveCalls = data.calls.filter(
  (c) => parseFloat(c.cost || 0) > costThreshold,
);

console.log(
  `Calls costing more than $${costThreshold}:`,
  expensiveCalls.length,
);
expensiveCalls.forEach((call) => {
  console.log(`- ${call.call_id}: $${call.cost} (${call.duration_seconds}s)`);
});

// Find very short calls
const shortCalls = data.calls.filter(
  (c) => c.duration_seconds > 0 && c.duration_seconds < 10,
);

console.log("Very short calls (<10s):", shortCalls.length);
shortCalls.forEach((call) => {
  console.log(
    `- ${call.customer_phone}: ${call.duration_seconds}s - ${call.ended_reason}`,
  );
});
```

## Python/Pandas Examples

### Load Data into DataFrame

```python
import pandas as pd
import json

# Load JSON data
with open('docs/vapi/data/vapi_calls_data.json', 'r') as f:
    data = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(data['calls'])

# Or load CSV directly
df = pd.read_csv('docs/vapi/data/vapi_calls_filtered.csv')

print(f"Total calls: {len(df)}")
print(df.head())
```

### Basic Analysis

```python
# Summary statistics
print(df['duration_seconds'].describe())

# Group by status
status_summary = df.groupby('status').agg({
    'duration_seconds': ['mean', 'median', 'count'],
    'cost': ['sum', 'mean']
}).round(2)

print(status_summary)

# Cost analysis
total_cost = df['cost'].sum()
avg_cost = df['cost'].mean()
print(f"Total cost: ${total_cost:.2f}")
print(f"Average cost: ${avg_cost:.4f}")
```

### Temporal Analysis

```python
# Convert to datetime
df['created_at'] = pd.to_datetime(df['created_at'])
df['call_date'] = pd.to_datetime(df['call_date'])

# Calls per day
daily_calls = df.groupby('call_date').size()
print(daily_calls)

# Calls per hour
hourly_calls = df.groupby('hour_of_day').size()
print(hourly_calls)

# Business hours vs after hours
business_hours = df[df['is_business_hours'] == True]
after_hours = df[df['is_business_hours'] == False]

print(f"Business hours: {len(business_hours)} ({len(business_hours)/len(df)*100:.1f}%)")
print(f"After hours: {len(after_hours)} ({len(after_hours)/len(df)*100:.1f}%)")
```

### Geographic Analysis

```python
# Top area codes
top_area_codes = df['area_code'].value_counts().head(10)
print("Top 10 Area Codes:")
print(top_area_codes)

# Success rate by area code
area_code_success = df.groupby('area_code').agg({
    'success_evaluation': 'mean',
    'call_id': 'count'
}).rename(columns={'call_id': 'count'})

area_code_success['success_rate'] = (area_code_success['success_evaluation'] * 100).round(2)
print(area_code_success.sort_values('count', ascending=False).head(10))
```

### Quality Analysis

```python
# Sentiment distribution
sentiment_dist = df['user_sentiment'].value_counts()
print("Sentiment Distribution:")
print(sentiment_dist)

# Success evaluation
success_rate = df['success_evaluation'].mean() * 100
print(f"Success rate: {success_rate:.2f}%")

# Correlation between duration and success
correlation = df[['duration_seconds', 'success_evaluation']].corr()
print("Correlation between duration and success:")
print(correlation)
```

### Export Filtered Data

```python
# Export successful calls to new CSV
successful_calls = df[df['success_evaluation'] == True]
successful_calls.to_csv('docs/vapi/data/successful_calls.csv', index=False)

# Export calls by area code
sf_bay_area = df[df['area_code'].isin(['408', '415', '650', '925', '510'])]
sf_bay_area.to_csv('docs/vapi/data/bay_area_calls.csv', index=False)

# Export business hours calls
business_hours_df = df[df['is_business_hours'] == True]
business_hours_df.to_csv('docs/vapi/data/business_hours_calls.csv', index=False)
```

## SQL Examples (if loaded into database)

### Create Table

```sql
CREATE TABLE vapi_call_analysis (
    call_id UUID PRIMARY KEY,
    created_at TIMESTAMP,
    status VARCHAR(50),
    ended_reason VARCHAR(100),
    customer_phone VARCHAR(20),
    area_code VARCHAR(3),
    duration_seconds INTEGER,
    cost DECIMAL(10, 4),
    user_sentiment VARCHAR(20),
    success_evaluation BOOLEAN,
    is_business_hours BOOLEAN,
    is_weekend BOOLEAN,
    hour_of_day INTEGER,
    day_of_week INTEGER
);

-- Load from CSV
COPY vapi_call_analysis
FROM '/path/to/vapi_calls_filtered.csv'
DELIMITER ','
CSV HEADER;
```

### Analysis Queries

```sql
-- Overall statistics
SELECT
    COUNT(*) as total_calls,
    COUNT(DISTINCT customer_phone) as unique_customers,
    AVG(duration_seconds) as avg_duration,
    SUM(cost) as total_cost,
    AVG(cost) as avg_cost,
    COUNT(CASE WHEN success_evaluation THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate
FROM vapi_call_analysis;

-- Calls by hour with success rate
SELECT
    hour_of_day,
    COUNT(*) as call_count,
    AVG(duration_seconds)::INTEGER as avg_duration,
    SUM(cost)::DECIMAL(10,2) as total_cost,
    COUNT(CASE WHEN success_evaluation THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate
FROM vapi_call_analysis
GROUP BY hour_of_day
ORDER BY hour_of_day;

-- Geographic distribution
SELECT
    area_code,
    COUNT(*) as calls,
    AVG(duration_seconds)::INTEGER as avg_duration,
    SUM(cost)::DECIMAL(10,2) as total_cost,
    COUNT(CASE WHEN success_evaluation THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate
FROM vapi_call_analysis
WHERE area_code IS NOT NULL
GROUP BY area_code
ORDER BY calls DESC;

-- Business hours vs after hours comparison
SELECT
    is_business_hours,
    COUNT(*) as calls,
    AVG(duration_seconds)::INTEGER as avg_duration,
    COUNT(CASE WHEN success_evaluation THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::FLOAT / COUNT(*) * 100 as completion_rate
FROM vapi_call_analysis
GROUP BY is_business_hours;

-- Most expensive calls
SELECT
    call_id,
    customer_phone,
    duration_seconds,
    cost,
    ended_reason,
    success_evaluation
FROM vapi_call_analysis
WHERE cost IS NOT NULL
ORDER BY cost DESC
LIMIT 10;

-- Success rate by ended reason
SELECT
    ended_reason,
    COUNT(*) as calls,
    AVG(duration_seconds)::INTEGER as avg_duration,
    COUNT(CASE WHEN success_evaluation THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate
FROM vapi_call_analysis
WHERE ended_reason IS NOT NULL
GROUP BY ended_reason
ORDER BY calls DESC;
```

## Excel/Google Sheets Analysis

### Import Data

1. Open Excel/Google Sheets
2. File → Import → CSV
3. Select `vapi_calls_filtered.csv`
4. Ensure proper delimiter (comma)

### Useful Formulas

**Success Rate:**

```excel
=COUNTIF(O:O, TRUE) / COUNTA(O:O) * 100
```

**Average Duration (formatted):**

```excel
=AVERAGE(K:K) / 86400
# Format cell as [mm]:ss
```

**Cost per Minute:**

```excel
=SUM(M:M) / (SUM(K:K) / 60)
```

**Calls by Hour (use COUNTIF):**

```excel
=COUNTIF(T:T, 16)  # For 4 PM
```

### Pivot Tables

**Create Pivot Table for Area Code Analysis:**

1. Select data range
2. Insert → Pivot Table
3. Rows: area_code
4. Values:
   - Count of call_id
   - Average of duration_seconds
   - Sum of cost
   - Count of success_evaluation

**Create Pivot Table for Temporal Analysis:**

1. Rows: day_of_week
2. Columns: hour_of_day
3. Values: Count of call_id

## R Examples

### Load and Analyze

```r
library(tidyverse)
library(lubridate)

# Load data
calls <- read_csv("docs/vapi/data/vapi_calls_filtered.csv")

# Summary statistics
summary(calls$duration_seconds)
summary(calls$cost)

# Success rate
success_rate <- mean(calls$success_evaluation, na.rm = TRUE) * 100
cat(sprintf("Success rate: %.2f%%\n", success_rate))

# Calls by hour
calls_by_hour <- calls %>%
  group_by(hour_of_day) %>%
  summarise(
    count = n(),
    avg_duration = mean(duration_seconds, na.rm = TRUE),
    success_rate = mean(success_evaluation, na.rm = TRUE) * 100
  ) %>%
  arrange(hour_of_day)

print(calls_by_hour)

# Plot calls by hour
ggplot(calls_by_hour, aes(x = hour_of_day, y = count)) +
  geom_col(fill = "steelblue") +
  labs(
    title = "VAPI Calls by Hour of Day",
    x = "Hour (24-hour format)",
    y = "Number of Calls"
  ) +
  theme_minimal()

# Geographic distribution
area_code_summary <- calls %>%
  filter(!is.na(area_code)) %>%
  group_by(area_code) %>%
  summarise(
    calls = n(),
    avg_duration = mean(duration_seconds, na.rm = TRUE),
    total_cost = sum(cost, na.rm = TRUE),
    success_rate = mean(success_evaluation, na.rm = TRUE) * 100
  ) %>%
  arrange(desc(calls))

print(area_code_summary)
```

## Tableau/Power BI Import

### Tableau

1. Connect to Data → Text File
2. Select `vapi_calls_filtered.csv`
3. Review data types in Data Source view
4. Create calculated fields:
   - `Success Rate`: `SUM([Success Evaluation]) / COUNT([Call Id])`
   - `Cost per Minute`: `SUM([Cost]) / (SUM([Duration Seconds]) / 60)`

### Power BI

1. Get Data → Text/CSV
2. Select `vapi_calls_filtered.csv`
3. Transform Data to adjust types
4. Create measures:

   ```DAX
   Success Rate =
   DIVIDE(
     COUNTROWS(FILTER('Calls', 'Calls'[success_evaluation] = TRUE)),
     COUNTROWS('Calls')
   ) * 100

   Cost per Minute =
   DIVIDE(
     SUM('Calls'[cost]),
     SUM('Calls'[duration_seconds]) / 60
   )
   ```

## Common Analysis Patterns

### 1. Peak Performance Analysis

Find the best-performing time slots:

```javascript
const performanceByHour = data.calls.reduce((acc, call) => {
  const hour = call.hour_of_day;
  if (!acc[hour]) {
    acc[hour] = { calls: 0, successful: 0, totalCost: 0 };
  }
  acc[hour].calls++;
  if (call.success_evaluation) acc[hour].successful++;
  acc[hour].totalCost += parseFloat(call.cost || 0);
  return acc;
}, {});

Object.entries(performanceByHour).forEach(([hour, stats]) => {
  stats.successRate = ((stats.successful / stats.calls) * 100).toFixed(2);
  stats.avgCost = (stats.totalCost / stats.calls).toFixed(4);
});

console.log("Performance by Hour:", performanceByHour);
```

### 2. Customer Engagement Score

Calculate engagement score based on duration and outcome:

```javascript
const calculateEngagementScore = (call) => {
  let score = 0;

  // Duration component (0-40 points)
  if (call.duration_seconds >= 60) score += 40;
  else if (call.duration_seconds >= 30) score += 20;
  else if (call.duration_seconds >= 10) score += 10;

  // Outcome component (0-40 points)
  if (call.ended_reason === "customer-ended-call") score += 40;
  else if (call.ended_reason === "assistant-ended-call") score += 30;

  // Success component (0-20 points)
  if (call.success_evaluation) score += 20;

  return score;
};

const callsWithScores = data.calls.map((call) => ({
  ...call,
  engagement_score: calculateEngagementScore(call),
}));

const avgEngagement =
  callsWithScores.reduce((sum, c) => sum + c.engagement_score, 0) /
  callsWithScores.length;
console.log(`Average engagement score: ${avgEngagement.toFixed(2)}/100`);
```

### 3. Cost Efficiency Analysis

Identify most cost-effective call patterns:

```javascript
const costEfficiency = data.calls
  .filter((c) => c.success_evaluation && c.duration_seconds > 0)
  .map((call) => ({
    call_id: call.call_id,
    cost_per_second: parseFloat(call.cost) / call.duration_seconds,
    duration: call.duration_seconds,
    area_code: call.area_code,
    hour: call.hour_of_day,
  }))
  .sort((a, b) => a.cost_per_second - b.cost_per_second);

console.log("Most cost-efficient successful calls:");
costEfficiency.slice(0, 10).forEach((call) => {
  console.log(
    `- Area ${call.area_code} at ${call.hour}:00: $${call.cost_per_second.toFixed(6)}/sec`,
  );
});
```

## Export Custom Reports

### Generate Custom CSV

```javascript
import { writeFileSync } from "fs";

// Filter and transform data
const customReport = data.calls
  .filter((call) => call.success_evaluation === true)
  .map((call) => ({
    date: call.call_date,
    time: call.call_time,
    phone: call.customer_phone,
    area_code: call.area_code,
    duration: call.duration_formatted,
    cost: `$${parseFloat(call.cost).toFixed(4)}`,
    outcome: call.ended_reason,
  }));

// Convert to CSV
const headers = Object.keys(customReport[0]).join(",");
const rows = customReport.map((row) => Object.values(row).join(","));
const csv = [headers, ...rows].join("\n");

writeFileSync("docs/vapi/data/custom_success_report.csv", csv);
console.log("Custom report exported");
```

---

**Note:** All examples assume the data files are in their default location: `docs/vapi/data/`

**Last Updated:** December 7, 2025
