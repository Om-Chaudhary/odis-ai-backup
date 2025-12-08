#!/usr/bin/env node

/**
 * VAPI Call Data Extraction and Analysis Script
 * Extracts scheduled discharge calls from Dec 1-7, 2025 and generates comprehensive reports
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Date range for analysis
const START_DATE = "2025-12-01";
const END_DATE = "2025-12-07 23:59:59";

/**
 * Extract all call data from scheduled_discharge_calls table
 */
async function extractCallData() {
  console.log("Extracting call data from scheduled_discharge_calls table...");

  const { data, error } = await supabase
    .from("scheduled_discharge_calls")
    .select("*")
    .gte("created_at", START_DATE)
    .lte("created_at", END_DATE)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching data:", error);
    throw error;
  }

  console.log(`Extracted ${data.length} calls`);
  return data;
}

/**
 * Enrich call data with calculated fields
 */
function enrichCallData(calls) {
  return calls.map((call) => {
    const createdAt = new Date(call.created_at);
    const customerPhone = call.customer_phone || "";

    return {
      ...call,
      // Temporal fields
      call_date: createdAt.toISOString().split("T")[0],
      call_time: createdAt.toTimeString().split(" ")[0],
      day_of_week: createdAt.getDay(),
      hour_of_day: createdAt.getHours(),

      // Geographic
      area_code:
        customerPhone.length >= 5 ? customerPhone.substring(2, 5) : null,

      // Duration formatting
      duration_formatted: call.duration_seconds
        ? `${Math.floor(call.duration_seconds / 60)
            .toString()
            .padStart(
              2,
              "0",
            )}:${(call.duration_seconds % 60).toString().padStart(2, "0")}`
        : null,

      // Business flags
      is_business_hours:
        createdAt.getHours() >= 9 &&
        createdAt.getHours() <= 17 &&
        createdAt.getDay() !== 0 &&
        createdAt.getDay() !== 6,
      is_weekend: createdAt.getDay() === 0 || createdAt.getDay() === 6,

      // Preview fields
      summary_preview: call.summary ? call.summary.substring(0, 200) : null,
      transcript_preview: call.transcript
        ? call.transcript.substring(0, 200)
        : null,
    };
  });
}

/**
 * Calculate comprehensive statistics
 */
function calculateStatistics(calls) {
  const stats = {
    total_calls: calls.length,
    unique_customers: new Set(
      calls.map((c) => c.customer_phone).filter(Boolean),
    ).size,

    // Duration statistics
    duration: {
      total_seconds: calls.reduce(
        (sum, c) => sum + (c.duration_seconds || 0),
        0,
      ),
      average: null,
      median: null,
      max: null,
      min: null,
    },

    // Cost statistics
    cost: {
      total: calls.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0),
      average: null,
      per_minute: null,
    },

    // Success metrics
    success_metrics: {
      completion_rate: null,
      positive_sentiment_rate: null,
      success_evaluation_rate: null,
    },

    // Distributions
    by_status: {},
    by_ended_reason: {},
    by_hour: {},
    by_day: {},
    by_area_code: {},
    by_condition: {},
    by_knowledge_base: {},
    by_sentiment: {},
    by_success_evaluation: {},
  };

  // Duration calculations
  const durations = calls
    .map((c) => c.duration_seconds)
    .filter((d) => d != null)
    .sort((a, b) => a - b);
  if (durations.length > 0) {
    stats.duration.average =
      durations.reduce((a, b) => a + b, 0) / durations.length;
    stats.duration.median = durations[Math.floor(durations.length / 2)];
    stats.duration.max = Math.max(...durations);
    stats.duration.min = Math.min(...durations);
  }

  // Cost calculations
  const totalDurationMinutes = stats.duration.total_seconds / 60;
  stats.cost.average =
    stats.total_calls > 0 ? stats.cost.total / stats.total_calls : 0;
  stats.cost.per_minute =
    totalDurationMinutes > 0 ? stats.cost.total / totalDurationMinutes : 0;

  // Success metrics
  const completedCalls = calls.filter((c) => c.status === "completed").length;
  const positiveSentiment = calls.filter(
    (c) => c.user_sentiment === "positive",
  ).length;
  const successEval = calls.filter((c) => c.success_evaluation === true).length;

  stats.success_metrics.completion_rate =
    (completedCalls / stats.total_calls) * 100;
  stats.success_metrics.positive_sentiment_rate =
    (positiveSentiment / stats.total_calls) * 100;
  stats.success_metrics.success_evaluation_rate =
    (successEval / stats.total_calls) * 100;

  // Distributions
  calls.forEach((call) => {
    // Status
    stats.by_status[call.status] = (stats.by_status[call.status] || 0) + 1;

    // Ended reason
    if (call.ended_reason) {
      stats.by_ended_reason[call.ended_reason] =
        (stats.by_ended_reason[call.ended_reason] || 0) + 1;
    }

    // Hour of day
    stats.by_hour[call.hour_of_day] =
      (stats.by_hour[call.hour_of_day] || 0) + 1;

    // Day of week
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[call.day_of_week];
    stats.by_day[dayName] = (stats.by_day[dayName] || 0) + 1;

    // Area code
    if (call.area_code) {
      stats.by_area_code[call.area_code] =
        (stats.by_area_code[call.area_code] || 0) + 1;
    }

    // Condition category
    if (call.condition_category) {
      stats.by_condition[call.condition_category] =
        (stats.by_condition[call.condition_category] || 0) + 1;
    }

    // Knowledge base
    if (call.knowledge_base_used) {
      const kbArray = Array.isArray(call.knowledge_base_used)
        ? call.knowledge_base_used
        : [call.knowledge_base_used];
      kbArray.forEach((kb) => {
        stats.by_knowledge_base[kb] = (stats.by_knowledge_base[kb] || 0) + 1;
      });
    }

    // Sentiment
    if (call.user_sentiment) {
      stats.by_sentiment[call.user_sentiment] =
        (stats.by_sentiment[call.user_sentiment] || 0) + 1;
    }

    // Success evaluation
    const successKey =
      call.success_evaluation === true
        ? "successful"
        : call.success_evaluation === false
          ? "unsuccessful"
          : "not_evaluated";
    stats.by_success_evaluation[successKey] =
      (stats.by_success_evaluation[successKey] || 0) + 1;
  });

  return stats;
}

/**
 * Generate CSV file
 */
function generateCSV(calls) {
  const headers = [
    "call_id",
    "vapi_call_id",
    "created_at",
    "scheduled_for",
    "started_at",
    "ended_at",
    "status",
    "ended_reason",
    "customer_phone",
    "area_code",
    "duration_seconds",
    "duration_formatted",
    "cost",
    "user_sentiment",
    "success_evaluation",
    "condition_category",
    "knowledge_base_used",
    "call_date",
    "call_time",
    "day_of_week",
    "hour_of_day",
    "is_business_hours",
    "is_weekend",
    "summary_preview",
    "transcript_preview",
  ];

  const rows = calls.map((call) => [
    call.id,
    call.vapi_call_id || "",
    call.created_at || "",
    call.scheduled_for || "",
    call.started_at || "",
    call.ended_at || "",
    call.status || "",
    call.ended_reason || "",
    call.customer_phone || "",
    call.area_code || "",
    call.duration_seconds || "",
    call.duration_formatted || "",
    call.cost || "",
    call.user_sentiment || "",
    call.success_evaluation || "",
    call.condition_category || "",
    Array.isArray(call.knowledge_base_used)
      ? call.knowledge_base_used.join(";")
      : call.knowledge_base_used || "",
    call.call_date || "",
    call.call_time || "",
    call.day_of_week,
    call.hour_of_day,
    call.is_business_hours,
    call.is_weekend,
    call.summary_preview ? `"${call.summary_preview.replace(/"/g, '""')}"` : "",
    call.transcript_preview
      ? `"${call.transcript_preview.replace(/"/g, '""')}"`
      : "",
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n",
  );

  return csv;
}

/**
 * Generate JSON file
 */
function generateJSON(calls, stats) {
  return {
    metadata: {
      extraction_date: new Date().toISOString(),
      total_calls: calls.length,
      date_range: {
        start: START_DATE,
        end: END_DATE.split(" ")[0],
      },
      table: "scheduled_discharge_calls",
    },
    calls: calls,
    statistics: stats,
    aggregations: {
      by_status: stats.by_status,
      by_ended_reason: stats.by_ended_reason,
      by_hour: stats.by_hour,
      by_day: stats.by_day,
      by_area_code: stats.by_area_code,
      by_condition: stats.by_condition,
      by_knowledge_base: stats.by_knowledge_base,
      by_sentiment: stats.by_sentiment,
      by_success_evaluation: stats.by_success_evaluation,
    },
  };
}

/**
 * Generate Markdown report
 */
function generateMarkdown(calls, stats) {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let md = `# VAPI Calls Analysis Report
**Date Range:** ${START_DATE} to ${END_DATE.split(" ")[0]}
**Generated:** ${new Date().toISOString()}
**Total Calls:** ${stats.total_calls}

---

## Executive Summary

This report analyzes ${stats.total_calls} scheduled discharge calls made between December 1-7, 2025. The calls were made to pet owners following their veterinary visits to provide post-appointment follow-up and care instructions.

### Key Findings

- **Total Calls:** ${stats.total_calls}
- **Unique Customers:** ${stats.unique_customers}
- **Completion Rate:** ${stats.success_metrics.completion_rate.toFixed(1)}%
- **Positive Sentiment Rate:** ${stats.success_metrics.positive_sentiment_rate.toFixed(1)}%
- **Success Evaluation Rate:** ${stats.success_metrics.success_evaluation_rate.toFixed(1)}%
- **Total Cost:** $${stats.cost.total.toFixed(2)}
- **Average Cost per Call:** $${stats.cost.average.toFixed(2)}
- **Total Duration:** ${Math.floor(stats.duration.total_seconds / 3600)}h ${Math.floor((stats.duration.total_seconds % 3600) / 60)}m

---

## Performance Metrics

### Call Status Distribution

| Status | Count | Percentage |
|--------|-------|------------|
${Object.entries(stats.by_status)
  .sort((a, b) => b[1] - a[1])
  .map(
    ([status, count]) =>
      `| ${status} | ${count} | ${((count / stats.total_calls) * 100).toFixed(1)}% |`,
  )
  .join("\n")}

### Ended Reason Distribution

| Reason | Count | Percentage |
|--------|-------|------------|
${Object.entries(stats.by_ended_reason)
  .sort((a, b) => b[1] - a[1])
  .map(
    ([reason, count]) =>
      `| ${reason || "N/A"} | ${count} | ${((count / stats.total_calls) * 100).toFixed(1)}% |`,
  )
  .join("\n")}

---

## Duration Analysis

| Metric | Value |
|--------|-------|
| **Average Duration** | ${Math.floor(stats.duration.average / 60)}m ${Math.floor(stats.duration.average % 60)}s |
| **Median Duration** | ${Math.floor(stats.duration.median / 60)}m ${Math.floor(stats.duration.median % 60)}s |
| **Maximum Duration** | ${Math.floor(stats.duration.max / 60)}m ${Math.floor(stats.duration.max % 60)}s |
| **Minimum Duration** | ${Math.floor(stats.duration.min / 60)}m ${Math.floor(stats.duration.min % 60)}s |
| **Total Duration** | ${Math.floor(stats.duration.total_seconds / 3600)}h ${Math.floor((stats.duration.total_seconds % 3600) / 60)}m |

### Duration Anomalies

**Unusually Long Calls (>30 minutes):**
${
  calls.filter((c) => c.duration_seconds > 1800).length > 0
    ? calls
        .filter((c) => c.duration_seconds > 1800)
        .map((c) => `- Call ${c.id}: ${c.duration_formatted} (${c.status})`)
        .join("\n")
    : "- None detected"
}

**Unusually Short Calls (<10 seconds):**
${
  calls.filter((c) => c.duration_seconds && c.duration_seconds < 10).length > 0
    ? calls
        .filter((c) => c.duration_seconds && c.duration_seconds < 10)
        .map(
          (c) =>
            `- Call ${c.id}: ${c.duration_formatted} (${c.ended_reason || c.status})`,
        )
        .join("\n")
    : "- None detected"
}

---

## Cost Analysis

| Metric | Value |
|--------|-------|
| **Total Cost** | $${stats.cost.total.toFixed(2)} |
| **Average Cost per Call** | $${stats.cost.average.toFixed(2)} |
| **Cost per Minute** | $${stats.cost.per_minute.toFixed(3)} |
| **Estimated Monthly Cost** | $${(stats.cost.total * 4.33).toFixed(2)} |

### Cost Distribution

${
  calls.length > 0
    ? (() => {
        const costs = calls
          .map((c) => parseFloat(c.cost) || 0)
          .filter((c) => c > 0)
          .sort((a, b) => b - a);
        const p25 = costs[Math.floor(costs.length * 0.25)] || 0;
        const p50 = costs[Math.floor(costs.length * 0.5)] || 0;
        const p75 = costs[Math.floor(costs.length * 0.75)] || 0;
        const p90 = costs[Math.floor(costs.length * 0.9)] || 0;

        return `- **25th Percentile:** $${p25.toFixed(2)}
- **50th Percentile (Median):** $${p50.toFixed(2)}
- **75th Percentile:** $${p75.toFixed(2)}
- **90th Percentile:** $${p90.toFixed(2)}`;
      })()
    : "- No cost data available"
}

---

## Temporal Patterns

### Calls by Hour of Day

| Hour | Calls | Percentage |
|------|-------|------------|
${Array.from({ length: 24 }, (_, i) => {
  const count = stats.by_hour[i] || 0;
  const pct =
    stats.total_calls > 0
      ? ((count / stats.total_calls) * 100).toFixed(1)
      : "0.0";
  return `| ${i.toString().padStart(2, "0")}:00 | ${count} | ${pct}% |`;
}).join("\n")}

**Peak Hours:** ${Object.entries(stats.by_hour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => `${hour}:00 (${count} calls)`)
    .join(", ")}

### Calls by Day of Week

| Day | Calls | Percentage |
|-----|-------|------------|
${dayNames
  .map((day) => {
    const count = stats.by_day[day] || 0;
    const pct =
      stats.total_calls > 0
        ? ((count / stats.total_calls) * 100).toFixed(1)
        : "0.0";
    return `| ${day} | ${count} | ${pct}% |`;
  })
  .join("\n")}

### Business Hours Analysis

- **Calls during business hours (9 AM - 5 PM, weekdays):** ${calls.filter((c) => c.is_business_hours).length} (${((calls.filter((c) => c.is_business_hours).length / stats.total_calls) * 100).toFixed(1)}%)
- **Calls after hours:** ${calls.filter((c) => !c.is_business_hours).length} (${((calls.filter((c) => !c.is_business_hours).length / stats.total_calls) * 100).toFixed(1)}%)
- **Weekend calls:** ${calls.filter((c) => c.is_weekend).length} (${((calls.filter((c) => c.is_weekend).length / stats.total_calls) * 100).toFixed(1)}%)

---

## Geographic Distribution

### Top 10 Area Codes

| Area Code | Calls | Percentage |
|-----------|-------|------------|
${Object.entries(stats.by_area_code)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(
    ([code, count]) =>
      `| ${code} | ${count} | ${((count / stats.total_calls) * 100).toFixed(1)}% |`,
  )
  .join("\n")}

**Total Area Codes:** ${Object.keys(stats.by_area_code).length}

---

## Quality Metrics

### User Sentiment Distribution

| Sentiment | Count | Percentage |
|-----------|-------|------------|
${Object.entries(stats.by_sentiment)
  .sort((a, b) => b[1] - a[1])
  .map(
    ([sentiment, count]) =>
      `| ${sentiment || "Not recorded"} | ${count} | ${((count / stats.total_calls) * 100).toFixed(1)}% |`,
  )
  .join("\n")}

### Success Evaluation

| Evaluation | Count | Percentage |
|------------|-------|------------|
${Object.entries(stats.by_success_evaluation)
  .sort((a, b) => b[1] - a[1])
  .map(
    ([evaluation, count]) =>
      `| ${evaluation} | ${count} | ${((count / stats.total_calls) * 100).toFixed(1)}% |`,
  )
  .join("\n")}

---

## Condition Categories

### Distribution by Veterinary Condition

| Condition Category | Calls | Percentage |
|-------------------|-------|------------|
${
  Object.entries(stats.by_condition).length > 0
    ? Object.entries(stats.by_condition)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([condition, count]) =>
            `| ${condition || "Not specified"} | ${count} | ${((count / stats.total_calls) * 100).toFixed(1)}% |`,
        )
        .join("\n")
    : "| Not specified | 0 | 0.0% |"
}

---

## Knowledge Base Usage

### Most Referenced Knowledge Bases

| Knowledge Base | References | Percentage |
|----------------|------------|------------|
${
  Object.entries(stats.by_knowledge_base).length > 0
    ? Object.entries(stats.by_knowledge_base)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([kb, count]) =>
            `| ${kb} | ${count} | ${((count / stats.total_calls) * 100).toFixed(1)}% |`,
        )
        .join("\n")
    : "| None | 0 | 0.0% |"
}

---

## Data Quality Assessment

### Completeness Check

| Field | Populated | Missing | Completeness |
|-------|-----------|---------|--------------|
| VAPI Call ID | ${calls.filter((c) => c.vapi_call_id).length} | ${calls.filter((c) => !c.vapi_call_id).length} | ${((calls.filter((c) => c.vapi_call_id).length / stats.total_calls) * 100).toFixed(1)}% |
| Customer Phone | ${calls.filter((c) => c.customer_phone).length} | ${calls.filter((c) => !c.customer_phone).length} | ${((calls.filter((c) => c.customer_phone).length / stats.total_calls) * 100).toFixed(1)}% |
| Duration | ${calls.filter((c) => c.duration_seconds).length} | ${calls.filter((c) => !c.duration_seconds).length} | ${((calls.filter((c) => c.duration_seconds).length / stats.total_calls) * 100).toFixed(1)}% |
| Cost | ${calls.filter((c) => c.cost).length} | ${calls.filter((c) => !c.cost).length} | ${((calls.filter((c) => c.cost).length / stats.total_calls) * 100).toFixed(1)}% |
| Transcript | ${calls.filter((c) => c.transcript).length} | ${calls.filter((c) => !c.transcript).length} | ${((calls.filter((c) => c.transcript).length / stats.total_calls) * 100).toFixed(1)}% |
| Summary | ${calls.filter((c) => c.summary).length} | ${calls.filter((c) => !c.summary).length} | ${((calls.filter((c) => c.summary).length / stats.total_calls) * 100).toFixed(1)}% |
| User Sentiment | ${calls.filter((c) => c.user_sentiment).length} | ${calls.filter((c) => !c.user_sentiment).length} | ${((calls.filter((c) => c.user_sentiment).length / stats.total_calls) * 100).toFixed(1)}% |
| Success Evaluation | ${calls.filter((c) => c.success_evaluation !== null).length} | ${calls.filter((c) => c.success_evaluation === null).length} | ${((calls.filter((c) => c.success_evaluation !== null).length / stats.total_calls) * 100).toFixed(1)}% |

### Phone Number Validation

- **Valid format:** ${calls.filter((c) => c.customer_phone && /^\+1\d{10}$/.test(c.customer_phone)).length}
- **Invalid format:** ${calls.filter((c) => c.customer_phone && !/^\+1\d{10}$/.test(c.customer_phone)).length}
- **Missing:** ${calls.filter((c) => !c.customer_phone).length}

---

## Recommendations

### Operational Optimization

1. **Peak Time Scheduling:** Based on the analysis, peak calling hours are ${Object.entries(
    stats.by_hour,
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`)
    .join(", ")}. Consider distributing calls more evenly to avoid congestion.

2. **Cost Efficiency:** Average cost per call is $${stats.cost.average.toFixed(2)}. Monitor high-cost outliers and investigate reasons for extended call durations.

3. **Success Rate Improvement:** Current completion rate is ${stats.success_metrics.completion_rate.toFixed(1)}%. Analyze failed calls to identify patterns and improve contact strategies.

### Data Quality Improvements

1. **Missing Fields:** ${calls.filter((c) => !c.user_sentiment).length} calls (${((calls.filter((c) => !c.user_sentiment).length / stats.total_calls) * 100).toFixed(1)}%) are missing sentiment analysis. Ensure all calls are properly analyzed.

2. **Phone Number Standardization:** Implement validation to ensure all phone numbers follow the +1XXXXXXXXXX format.

3. **Condition Categorization:** ${calls.filter((c) => !c.condition_category).length} calls lack condition categories. Improve categorization during call setup.

### Next Steps

1. Conduct deeper analysis on failed calls to identify common failure patterns
2. Review unusually long or short calls for quality assurance
3. Analyze transcript data for common customer questions and concerns
4. Compare performance across different condition categories
5. Evaluate ROI of VAPI integration based on cost vs. customer satisfaction metrics

---

## Appendix

### Data Sources

- **Table:** scheduled_discharge_calls
- **Date Range:** ${START_DATE} to ${END_DATE.split(" ")[0]}
- **Extraction Date:** ${new Date().toISOString()}
- **Total Records:** ${stats.total_calls}

### Methodology

This analysis was performed using comprehensive SQL queries against the Supabase database, extracting all relevant call metadata, performance metrics, and quality indicators. Statistical calculations include:

- Descriptive statistics (mean, median, min, max)
- Distribution analysis across temporal, geographic, and categorical dimensions
- Quality metrics based on sentiment analysis and success evaluation
- Cost analysis with per-call and per-minute breakdowns

---

*Report generated automatically by VAPI Data Analysis Script*
`;

  return md;
}

/**
 * Perform data quality checks
 */
function performQualityChecks(calls) {
  const checks = {
    phone_validation: {
      valid: calls.filter(
        (c) => c.customer_phone && /^\+1\d{10}$/.test(c.customer_phone),
      ).length,
      invalid: calls.filter(
        (c) => c.customer_phone && !/^\+1\d{10}$/.test(c.customer_phone),
      ).length,
      missing: calls.filter((c) => !c.customer_phone).length,
    },
    duration_anomalies: {
      too_long: calls.filter((c) => c.duration_seconds > 1800),
      too_short: calls.filter(
        (c) => c.duration_seconds && c.duration_seconds < 10,
      ),
    },
    missing_critical_fields: {
      no_vapi_id: calls.filter((c) => !c.vapi_call_id).length,
      no_status: calls.filter((c) => !c.status).length,
      no_cost: calls.filter((c) => !c.cost).length,
      no_duration: calls.filter((c) => !c.duration_seconds).length,
    },
    cost_outliers: (() => {
      const costs = calls
        .map((c) => parseFloat(c.cost) || 0)
        .filter((c) => c > 0)
        .sort((a, b) => a - b);
      const q1 = costs[Math.floor(costs.length * 0.25)] || 0;
      const q3 = costs[Math.floor(costs.length * 0.75)] || 0;
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      return {
        outliers: calls.filter((c) => {
          const cost = parseFloat(c.cost) || 0;
          return cost > 0 && (cost < lowerBound || cost > upperBound);
        }),
        lower_bound: lowerBound,
        upper_bound: upperBound,
      };
    })(),
  };

  return checks;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("=".repeat(60));
    console.log("VAPI Call Data Extraction & Analysis");
    console.log("=".repeat(60));
    console.log(`Date Range: ${START_DATE} to ${END_DATE.split(" ")[0]}`);
    console.log("=".repeat(60));
    console.log();

    // Step 1: Extract data
    const rawCalls = await extractCallData();

    if (rawCalls.length === 0) {
      console.log("No calls found in the specified date range.");
      return;
    }

    // Step 2: Enrich data
    console.log("Enriching call data with calculated fields...");
    const enrichedCalls = enrichCallData(rawCalls);

    // Step 3: Calculate statistics
    console.log("Calculating comprehensive statistics...");
    const statistics = calculateStatistics(enrichedCalls);

    // Step 4: Perform quality checks
    console.log("Performing data quality checks...");
    const qualityChecks = performQualityChecks(enrichedCalls);

    // Step 5: Generate outputs
    console.log("Generating output files...");

    const rootDir = join(__dirname, "..");

    // CSV
    const csv = generateCSV(enrichedCalls);
    writeFileSync(join(rootDir, "vapi_calls_filtered.csv"), csv);
    console.log("✓ Generated vapi_calls_filtered.csv");

    // JSON
    const json = generateJSON(enrichedCalls, statistics);
    writeFileSync(
      join(rootDir, "vapi_calls_data.json"),
      JSON.stringify(json, null, 2),
    );
    console.log("✓ Generated vapi_calls_data.json");

    // Markdown
    const markdown = generateMarkdown(enrichedCalls, statistics);
    writeFileSync(join(rootDir, "vapi_calls_analysis.md"), markdown);
    console.log("✓ Generated vapi_calls_analysis.md");

    // Summary
    console.log();
    console.log("=".repeat(60));
    console.log("ANALYSIS COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total Calls: ${statistics.total_calls}`);
    console.log(`Unique Customers: ${statistics.unique_customers}`);
    console.log(
      `Completion Rate: ${statistics.success_metrics.completion_rate.toFixed(1)}%`,
    );
    console.log(`Total Cost: $${statistics.cost.total.toFixed(2)}`);
    console.log(
      `Average Duration: ${Math.floor(statistics.duration.average / 60)}m ${Math.floor(statistics.duration.average % 60)}s`,
    );
    console.log();
    console.log("Quality Checks:");
    console.log(
      `  Phone Numbers - Valid: ${qualityChecks.phone_validation.valid}, Invalid: ${qualityChecks.phone_validation.invalid}, Missing: ${qualityChecks.phone_validation.missing}`,
    );
    console.log(
      `  Duration Anomalies - Too Long: ${qualityChecks.duration_anomalies.too_long.length}, Too Short: ${qualityChecks.duration_anomalies.too_short.length}`,
    );
    console.log(
      `  Cost Outliers: ${qualityChecks.cost_outliers.outliers.length}`,
    );
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Error during analysis:", error);
    process.exit(1);
  }
}

main();
