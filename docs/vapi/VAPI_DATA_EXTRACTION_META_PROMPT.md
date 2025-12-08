# VAPI Call Data Extraction & Analysis Meta Prompt

## Objective

Extract comprehensive VAPI call data for deep analysis, filtering by specific criteria, and create a multi-dimensional dataset suitable for business intelligence, performance analysis, and operational insights.

## Data Extraction Requirements

### 1. Primary Data Sources

```
- VAPI MCP Server (mcp__vapi-mcp__)
  - list_calls: Get all calls with filtering
  - get_call: Get detailed call information
  - get_assistant: Get assistant configuration details

- Supabase Database (mcp__supabase__)
  - vapi_calls table: Historical call records
  - call_transcripts: Full conversation transcripts
  - call_metrics: Performance and cost metrics
  - assistant_configurations: Assistant settings history
```

### 2. Core Call Attributes to Extract

#### Basic Information

- call_id (unique identifier)
- created_at (ISO timestamp)
- updated_at (ISO timestamp)
- status (queued, ringing, in-progress, ended, failed)
- ended_reason (customer-ended, assistant-ended, silence-timeout, error, etc.)
- assistant_id
- assistant_name
- phone_number_id
- phone_number_used

#### Customer Information

- customer_phone_number
- customer_phone_formatted (with country code)
- customer_area_code
- customer_state/region (derived from area code)
- customer_timezone (derived from area code)
- customer_type (new, returning, etc.)

#### Call Metrics

- duration_seconds
- duration_formatted (MM:SS)
- ring_time_seconds
- talk_time_seconds
- silence_duration_seconds
- interruption_count
- speaking_turns
- assistant_speak_time
- customer_speak_time
- overlap_duration

#### Cost Analysis

- total_cost_usd
- transcription_cost
- llm_cost
- voice_synthesis_cost
- telephony_cost
- cost_per_minute

#### Quality Metrics

- sentiment_score (-1 to 1)
- conversation_quality_score (0-100)
- completion_rate
- objective_achieved (boolean)
- customer_satisfaction_inferred
- escalation_requested (boolean)
- transfer_requested (boolean)

#### Technical Metrics

- latency_first_response_ms
- average_latency_ms
- max_latency_ms
- network_quality_score
- audio_quality_score
- transcription_accuracy_score
- retry_count
- error_count
- webhook_delivery_status

#### Content Analysis

- transcript_word_count
- topics_discussed (array)
- keywords_mentioned (array)
- questions_asked_count
- questions_answered_count
- action_items_identified (array)
- compliance_issues_detected (array)

#### Temporal Analysis

- call_date (YYYY-MM-DD)
- call_time (HH:MM:SS)
- day_of_week
- hour_of_day (0-23)
- is_business_hours (boolean)
- is_weekend (boolean)
- is_holiday (boolean)
- time_since_last_call_hours

### 3. Filtering Criteria

```yaml
filters:
  required:
    - assistant_id: "specific_assistant_id"
    - date_range:
        start: "YYYY-MM-DD"
        end: "YYYY-MM-DD"

  exclusions:
    - phone_numbers: ["number1", "number2"]
    - statuses: ["failed", "error"]
    - ended_reasons: ["error", "system-error"]

  inclusions:
    - min_duration_seconds: 10
    - max_duration_seconds: 3600
    - customer_area_codes: ["408", "415", "650"]
    - business_hours_only: true
```

### 4. Data Enrichment Steps

#### Step 1: Fetch Raw Data

```sql
-- Supabase query example
SELECT
  vc.*,
  ct.transcript,
  ct.summary,
  cm.sentiment_score,
  cm.quality_score,
  ac.configuration
FROM vapi_calls vc
LEFT JOIN call_transcripts ct ON vc.call_id = ct.call_id
LEFT JOIN call_metrics cm ON vc.call_id = cm.call_id
LEFT JOIN assistant_configurations ac ON vc.assistant_id = ac.assistant_id
WHERE vc.assistant_id = $1
  AND vc.created_at BETWEEN $2 AND $3
  AND vc.customer_phone NOT IN ($4)
ORDER BY vc.created_at DESC;
```

#### Step 2: Calculate Derived Metrics

```javascript
// Duration calculations
call.duration_seconds =
  (new Date(call.updated_at) - new Date(call.created_at)) / 1000;
call.duration_formatted = formatDuration(call.duration_seconds);

// Geographic enrichment
call.area_code = extractAreaCode(call.customer_phone);
call.region = lookupRegion(call.area_code);
call.timezone = lookupTimezone(call.area_code);

// Temporal enrichment
call.hour_of_day = new Date(call.created_at).getHours();
call.day_of_week = getDayOfWeek(call.created_at);
call.is_business_hours = isBusinessHours(call.created_at);

// Performance scoring
call.quality_score = calculateQualityScore({
  duration: call.duration_seconds,
  sentiment: call.sentiment_score,
  completion: call.ended_reason === "assistant-ended-call",
  errors: call.error_count,
});
```

#### Step 3: Aggregate Statistics

```javascript
const statistics = {
  total_calls: calls.length,
  total_duration_minutes: sumDuration / 60,
  average_duration_seconds: avgDuration,
  median_duration_seconds: medianDuration,

  completion_rate: completedCalls / totalCalls,
  customer_end_rate: customerEndedCalls / totalCalls,
  timeout_rate: timeoutCalls / totalCalls,

  peak_hour: mostCommonHour,
  peak_day: mostCommonDay,

  total_cost: sumCost,
  average_cost_per_call: avgCost,
  cost_per_minute: totalCost / totalMinutes,

  unique_customers: uniquePhoneNumbers.size,
  repeat_callers: repeatCallers.length,

  geographic_distribution: groupByAreaCode,
  temporal_distribution: groupByHour,

  quality_metrics: {
    average_sentiment: avgSentiment,
    average_quality: avgQuality,
    high_quality_rate: highQualityCalls / totalCalls,
  },
};
```

### 5. Output Formats

#### CSV Format (Primary)

```csv
call_id,created_at,updated_at,status,ended_reason,customer_phone,area_code,region,timezone,duration_seconds,duration_formatted,day_of_week,hour_of_day,is_business_hours,sentiment_score,quality_score,total_cost,transcript_preview,topics,action_items
```

#### JSON Format (Detailed)

```json
{
  "metadata": {
    "extraction_date": "2025-12-07T12:00:00Z",
    "assistant_id": "xxx",
    "total_calls": 100,
    "filtered_calls": 85,
    "date_range": {
      "start": "2025-12-01",
      "end": "2025-12-07"
    }
  },
  "calls": [
    {
      "call_id": "xxx",
      "timestamps": {},
      "customer": {},
      "metrics": {},
      "quality": {},
      "content": {},
      "costs": {}
    }
  ],
  "aggregations": {
    "by_hour": {},
    "by_day": {},
    "by_region": {},
    "by_outcome": {}
  }
}
```

#### Analysis Report (Markdown)

```markdown
# VAPI Call Analysis Report

## Executive Summary

- Total Calls Analyzed: X
- Date Range: START - END
- Overall Success Rate: X%
- Total Cost: $X
- Average Call Duration: X seconds

## Key Findings

1. Peak calling hours are between X and Y
2. Highest success rate with customers from REGION
3. Average sentiment score: X

## Detailed Metrics

[Tables and charts]

## Recommendations

1. Optimize calling times for better engagement
2. Review timeout settings for specific regions
3. Improve script for common failure points
```

### 6. Implementation Steps

```python
# Meta-implementation pseudocode

async def extract_vapi_call_data(config):
    # 1. Validate configuration
    validate_filters(config.filters)

    # 2. Fetch from VAPI
    vapi_calls = await vapi_client.list_calls(
        assistant_id=config.assistant_id
    )

    # 3. Fetch from Supabase for enrichment
    db_data = await supabase.from('vapi_calls')
        .select('*')
        .eq('assistant_id', config.assistant_id)
        .gte('created_at', config.date_start)
        .lte('created_at', config.date_end)
        .execute()

    # 4. Merge and enrich data
    enriched_calls = []
    for call in vapi_calls:
        # Skip excluded numbers
        if call.customer.number in config.exclude_numbers:
            continue

        # Enrich with database data
        db_record = find_db_record(db_data, call.id)

        # Calculate all metrics
        enriched = enrich_call_data(call, db_record)
        enriched_calls.append(enriched)

    # 5. Generate aggregations
    statistics = calculate_statistics(enriched_calls)

    # 6. Create outputs
    create_csv(enriched_calls, 'vapi_calls_comprehensive.csv')
    create_json(enriched_calls, statistics, 'vapi_calls_data.json')
    create_report(enriched_calls, statistics, 'vapi_analysis_report.md')

    return {
        'calls': enriched_calls,
        'statistics': statistics,
        'files_created': ['csv', 'json', 'md']
    }
```

### 7. Advanced Analysis Queries

#### Conversation Quality Analysis

```sql
WITH call_quality AS (
  SELECT
    call_id,
    CASE
      WHEN duration_seconds < 30 THEN 'very_short'
      WHEN duration_seconds < 120 THEN 'short'
      WHEN duration_seconds < 300 THEN 'medium'
      ELSE 'long'
    END as duration_category,
    CASE
      WHEN ended_reason = 'assistant-ended-call' THEN 'completed'
      WHEN ended_reason = 'customer-ended-call' THEN 'interrupted'
      ELSE 'failed'
    END as outcome
  FROM vapi_calls
)
SELECT
  duration_category,
  outcome,
  COUNT(*) as call_count,
  AVG(sentiment_score) as avg_sentiment
FROM call_quality
GROUP BY duration_category, outcome
ORDER BY duration_category, outcome;
```

#### Customer Behavior Patterns

```sql
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  EXTRACT(DOW FROM created_at) as day_of_week,
  COUNT(*) as call_count,
  AVG(duration_seconds) as avg_duration,
  SUM(CASE WHEN ended_reason = 'assistant-ended-call' THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as completion_rate
FROM vapi_calls
WHERE assistant_id = $1
GROUP BY hour, day_of_week
ORDER BY hour, day_of_week;
```

#### Cost Optimization Analysis

```sql
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as calls,
  SUM(total_cost) as daily_cost,
  AVG(total_cost) as avg_cost_per_call,
  SUM(duration_seconds) / 60.0 as total_minutes,
  SUM(total_cost) / (SUM(duration_seconds) / 60.0) as cost_per_minute
FROM vapi_calls
WHERE assistant_id = $1
GROUP BY date
ORDER BY date DESC;
```

### 8. Error Handling & Validation

```yaml
validations:
  - check: phone_number_format
    pattern: "^\\+1[0-9]{10}$"
    action: flag_invalid

  - check: duration_bounds
    min: 0
    max: 7200
    action: investigate_outliers

  - check: cost_bounds
    max: 10.00
    action: flag_high_cost

  - check: data_completeness
    required_fields: [call_id, created_at, status]
    action: skip_incomplete

error_handling:
  - type: api_rate_limit
    action: implement_backoff
    max_retries: 3

  - type: missing_enrichment_data
    action: use_defaults
    log: true

  - type: calculation_error
    action: set_null
    flag: needs_review
```

### 9. Usage Instructions

1. **Configure filters**: Set assistant_id, date range, and exclusions
2. **Run extraction**: Execute the meta prompt with required parameters
3. **Validate data**: Check for completeness and accuracy
4. **Generate outputs**: Create CSV, JSON, and report files
5. **Analyze results**: Use aggregated statistics for insights
6. **Iterate**: Refine filters and re-run as needed

### 10. Expected Deliverables

1. **Comprehensive CSV** with all call records and metrics
2. **JSON data file** with full details and aggregations
3. **Analysis report** with key findings and recommendations
4. **Statistical summary** with distributions and trends
5. **Quality scorecard** rating call performance
6. **Cost analysis** breakdown by various dimensions
7. **Customer insights** based on behavior patterns
8. **Operational recommendations** for optimization
