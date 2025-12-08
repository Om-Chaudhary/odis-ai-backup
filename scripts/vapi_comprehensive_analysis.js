#!/usr/bin/env node
/**
 * VAPI Call Data Comprehensive Analysis Script
 * Extracts and analyzes scheduled discharge calls from December 1-7, 2025
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions
function formatDuration(seconds) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function extractAreaCode(phone) {
  if (!phone || phone.length < 5) return null;
  return phone.substring(2, 5);
}

function isBusinessHours(date) {
  const hour = date.getHours();
  const day = date.getDay();
  return hour >= 9 && hour <= 17 && day !== 0 && day !== 6;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function calculateMedian(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function truncateText(text, maxLength = 200) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Main extraction function
async function extractCallData() {
  console.log("Extracting VAPI call data from scheduled_discharge_calls...");

  const { data, error } = await supabase
    .from("scheduled_discharge_calls")
    .select("*")
    .gte("created_at", "2025-12-01")
    .lte("created_at", "2025-12-07 23:59:59")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching data:", error);
    throw error;
  }

  console.log(`Found ${data.length} calls`);
  return data;
}

// Enrich call data with calculated fields
function enrichCallData(calls) {
  return calls.map((call) => {
    const createdDate = new Date(call.created_at);

    return {
      ...call,
      call_date: createdDate.toISOString().split("T")[0],
      call_time: createdDate.toTimeString().split(" ")[0],
      day_of_week: createdDate.getDay(),
      hour_of_day: createdDate.getHours(),
      area_code: extractAreaCode(call.customer_phone),
      duration_formatted: formatDuration(call.duration_seconds),
      is_business_hours: isBusinessHours(createdDate),
      is_weekend: isWeekend(createdDate),
    };
  });
}

// Calculate aggregated statistics
function calculateStatistics(calls) {
  const uniqueCustomers = new Set(calls.map((c) => c.customer_phone)).size;
  const completedCalls = calls.filter(
    (c) => c.status === "ended" && c.ended_reason === "hangup",
  );
  const callsWithDuration = calls.filter((c) => c.duration_seconds > 0);
  const durations = callsWithDuration.map((c) => c.duration_seconds);
  const costs = calls
    .filter((c) => c.cost != null)
    .map((c) => parseFloat(c.cost) || 0);

  // Status distribution
  const byStatus = calls.reduce((acc, call) => {
    acc[call.status] = (acc[call.status] || 0) + 1;
    return acc;
  }, {});

  // Ended reason distribution
  const byEndedReason = calls.reduce((acc, call) => {
    if (call.ended_reason) {
      acc[call.ended_reason] = (acc[call.ended_reason] || 0) + 1;
    }
    return acc;
  }, {});

  // Hour distribution
  const byHour = calls.reduce((acc, call) => {
    acc[call.hour_of_day] = (acc[call.hour_of_day] || 0) + 1;
    return acc;
  }, {});

  // Day distribution
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const byDay = calls.reduce((acc, call) => {
    const dayName = dayNames[call.day_of_week];
    acc[dayName] = (acc[dayName] || 0) + 1;
    return acc;
  }, {});

  // Area code distribution
  const byAreaCode = calls.reduce((acc, call) => {
    if (call.area_code) {
      acc[call.area_code] = (acc[call.area_code] || 0) + 1;
    }
    return acc;
  }, {});

  // Condition category distribution
  const byCondition = calls.reduce((acc, call) => {
    if (call.condition_category) {
      acc[call.condition_category] = (acc[call.condition_category] || 0) + 1;
    }
    return acc;
  }, {});

  // Knowledge base distribution
  const byKnowledgeBase = calls.reduce((acc, call) => {
    if (call.knowledge_base_used) {
      const kb = Array.isArray(call.knowledge_base_used)
        ? call.knowledge_base_used.join(", ")
        : call.knowledge_base_used;
      acc[kb] = (acc[kb] || 0) + 1;
    }
    return acc;
  }, {});

  // Sentiment distribution
  const bySentiment = calls.reduce((acc, call) => {
    if (call.user_sentiment) {
      acc[call.user_sentiment] = (acc[call.user_sentiment] || 0) + 1;
    }
    return acc;
  }, {});

  // Success evaluation distribution
  const bySuccess = calls.reduce((acc, call) => {
    if (call.success_evaluation != null) {
      const key = call.success_evaluation ? "Successful" : "Not Successful";
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
  const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);

  return {
    total_calls: calls.length,
    unique_customers: uniqueCustomers,
    completed_calls: completedCalls.length,
    completion_rate:
      calls.length > 0
        ? ((completedCalls.length / calls.length) * 100).toFixed(2)
        : 0,

    duration: {
      total_seconds: totalDuration,
      total_formatted: formatDuration(totalDuration),
      average:
        durations.length > 0
          ? (totalDuration / durations.length).toFixed(2)
          : 0,
      median: calculateMedian(durations).toFixed(2),
      max: durations.length > 0 ? Math.max(...durations) : 0,
      min: durations.length > 0 ? Math.min(...durations) : 0,
    },

    cost: {
      total: totalCost.toFixed(4),
      average: costs.length > 0 ? (totalCost / costs.length).toFixed(4) : 0,
      per_minute:
        totalDuration > 0 ? ((totalCost / totalDuration) * 60).toFixed(4) : 0,
      max: costs.length > 0 ? Math.max(...costs).toFixed(4) : 0,
      min: costs.length > 0 ? Math.min(...costs).toFixed(4) : 0,
    },

    success_metrics: {
      completion_rate: `${((completedCalls.length / calls.length) * 100).toFixed(2)}%`,
      positive_sentiment_rate: `${((calls.filter((c) => c.user_sentiment === "positive").length / calls.length) * 100).toFixed(2)}%`,
      success_evaluation_rate: `${((calls.filter((c) => c.success_evaluation === true).length / calls.length) * 100).toFixed(2)}%`,
    },

    aggregations: {
      by_status: byStatus,
      by_ended_reason: byEndedReason,
      by_hour: byHour,
      by_day: byDay,
      by_area_code: byAreaCode,
      by_condition: byCondition,
      by_knowledge_base: byKnowledgeBase,
      by_sentiment: bySentiment,
      by_success: bySuccess,
    },
  };
}

// Generate CSV output
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
    "summary",
    "transcript_preview",
  ];

  const rows = calls.map((call) =>
    [
      call.id || "",
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
      call.success_evaluation !== null ? call.success_evaluation : "",
      call.condition_category || "",
      Array.isArray(call.knowledge_base_used)
        ? call.knowledge_base_used.join("; ")
        : call.knowledge_base_used || "",
      call.call_date || "",
      call.call_time || "",
      call.day_of_week !== undefined ? call.day_of_week : "",
      call.hour_of_day !== undefined ? call.hour_of_day : "",
      call.is_business_hours !== undefined ? call.is_business_hours : "",
      call.is_weekend !== undefined ? call.is_weekend : "",
      truncateText(call.summary, 200),
      truncateText(call.transcript, 200),
    ]
      .map((field) => {
        // Escape CSV fields
        const stringField = String(field);
        if (
          stringField.includes(",") ||
          stringField.includes('"') ||
          stringField.includes("\n")
        ) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      })
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

// Generate JSON output
function generateJSON(calls, statistics) {
  return {
    metadata: {
      extraction_date: new Date().toISOString(),
      total_calls: calls.length,
      date_range: {
        start: "2025-12-01",
        end: "2025-12-07",
      },
      table: "scheduled_discharge_calls",
    },
    calls: calls,
    statistics: statistics,
    aggregations: statistics.aggregations,
  };
}

// Generate Markdown report
function generateMarkdown(calls, statistics) {
  const md = [];

  md.push("# VAPI Call Data Analysis Report");
  md.push("");
  md.push("**Analysis Period:** December 1-7, 2025");
  md.push(`**Generated:** ${new Date().toISOString()}`);
  md.push(`**Total Calls Analyzed:** ${statistics.total_calls}`);
  md.push("");

  md.push("## Executive Summary");
  md.push("");
  md.push(
    `This report provides a comprehensive analysis of ${statistics.total_calls} scheduled discharge calls made during the week of December 1-7, 2025. The analysis includes performance metrics, geographic distribution, temporal patterns, cost analysis, and quality metrics.`,
  );
  md.push("");

  md.push("## Key Metrics Dashboard");
  md.push("");
  md.push("| Metric | Value |");
  md.push("|--------|-------|");
  md.push(`| Total Calls | ${statistics.total_calls} |`);
  md.push(`| Unique Customers | ${statistics.unique_customers} |`);
  md.push(`| Completed Calls | ${statistics.completed_calls} |`);
  md.push(`| Completion Rate | ${statistics.completion_rate}% |`);
  md.push(
    `| Average Duration | ${statistics.duration.average}s (${formatDuration(parseFloat(statistics.duration.average))}) |`,
  );
  md.push(`| Median Duration | ${statistics.duration.median}s |`);
  md.push(`| Total Cost | $${statistics.cost.total} |`);
  md.push(`| Average Cost | $${statistics.cost.average} |`);
  md.push(`| Cost per Minute | $${statistics.cost.per_minute} |`);
  md.push("");

  md.push("## Performance Analysis");
  md.push("");
  md.push("### Call Status Distribution");
  md.push("");
  md.push("| Status | Count | Percentage |");
  md.push("|--------|-------|------------|");
  Object.entries(statistics.aggregations.by_status).forEach(
    ([status, count]) => {
      const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
      md.push(`| ${status} | ${count} | ${percentage}% |`);
    },
  );
  md.push("");

  md.push("### Call Outcome Distribution");
  md.push("");
  md.push("| Outcome | Count | Percentage |");
  md.push("|---------|-------|------------|");
  Object.entries(statistics.aggregations.by_ended_reason).forEach(
    ([reason, count]) => {
      const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
      md.push(`| ${reason || "Not ended"} | ${count} | ${percentage}% |`);
    },
  );
  md.push("");

  md.push("## Geographic Distribution");
  md.push("");
  md.push("### Top Area Codes");
  md.push("");
  md.push("| Area Code | Calls | Percentage |");
  md.push("|-----------|-------|------------|");
  const sortedAreaCodes = Object.entries(statistics.aggregations.by_area_code)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  sortedAreaCodes.forEach(([code, count]) => {
    const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
    md.push(`| ${code} | ${count} | ${percentage}% |`);
  });
  md.push("");

  md.push("## Temporal Patterns");
  md.push("");
  md.push("### Calls by Day of Week");
  md.push("");
  md.push("| Day | Calls | Percentage |");
  md.push("|-----|-------|------------|");
  Object.entries(statistics.aggregations.by_day).forEach(([day, count]) => {
    const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
    md.push(`| ${day} | ${count} | ${percentage}% |`);
  });
  md.push("");

  md.push("### Calls by Hour of Day");
  md.push("");
  md.push("| Hour | Calls | Percentage |");
  md.push("|------|-------|------------|");
  const sortedHours = Object.entries(statistics.aggregations.by_hour).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );
  sortedHours.forEach(([hour, count]) => {
    const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
    const hourFormatted = `${hour}:00 - ${hour}:59`;
    md.push(`| ${hourFormatted} | ${count} | ${percentage}% |`);
  });
  md.push("");

  const businessHoursCalls = calls.filter((c) => c.is_business_hours).length;
  const weekendCalls = calls.filter((c) => c.is_weekend).length;
  md.push("### Business Hours Analysis");
  md.push("");
  md.push(
    `- **Business Hours (M-F, 9AM-5PM):** ${businessHoursCalls} calls (${((businessHoursCalls / statistics.total_calls) * 100).toFixed(2)}%)`,
  );
  md.push(
    `- **After Hours/Weekends:** ${statistics.total_calls - businessHoursCalls} calls (${(((statistics.total_calls - businessHoursCalls) / statistics.total_calls) * 100).toFixed(2)}%)`,
  );
  md.push(
    `- **Weekend Calls:** ${weekendCalls} calls (${((weekendCalls / statistics.total_calls) * 100).toFixed(2)}%)`,
  );
  md.push("");

  md.push("## Cost Analysis");
  md.push("");
  md.push("| Metric | Value |");
  md.push("|--------|-------|");
  md.push(`| Total Cost | $${statistics.cost.total} |`);
  md.push(`| Average Cost per Call | $${statistics.cost.average} |`);
  md.push(`| Cost per Minute | $${statistics.cost.per_minute} |`);
  md.push(`| Maximum Call Cost | $${statistics.cost.max} |`);
  md.push(`| Minimum Call Cost | $${statistics.cost.min} |`);
  md.push("");

  md.push("## Quality Metrics");
  md.push("");
  md.push("### Sentiment Analysis");
  md.push("");
  md.push("| Sentiment | Count | Percentage |");
  md.push("|-----------|-------|------------|");
  Object.entries(statistics.aggregations.by_sentiment).forEach(
    ([sentiment, count]) => {
      const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
      md.push(`| ${sentiment || "Unknown"} | ${count} | ${percentage}% |`);
    },
  );
  md.push("");

  md.push("### Success Evaluation");
  md.push("");
  md.push("| Evaluation | Count | Percentage |");
  md.push("|------------|-------|------------|");
  Object.entries(statistics.aggregations.by_success).forEach(
    ([success, count]) => {
      const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
      md.push(`| ${success} | ${count} | ${percentage}% |`);
    },
  );
  md.push("");

  md.push("## Condition Categories Analysis");
  md.push("");
  if (Object.keys(statistics.aggregations.by_condition).length > 0) {
    md.push("| Condition Category | Calls | Percentage |");
    md.push("|--------------------|-------|------------|");
    const sortedConditions = Object.entries(
      statistics.aggregations.by_condition,
    ).sort(([, a], [, b]) => b - a);
    sortedConditions.forEach(([condition, count]) => {
      const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
      md.push(`| ${condition} | ${count} | ${percentage}% |`);
    });
  } else {
    md.push("No condition category data available.");
  }
  md.push("");

  md.push("## Knowledge Base Usage");
  md.push("");
  if (Object.keys(statistics.aggregations.by_knowledge_base).length > 0) {
    md.push("| Knowledge Base | Calls | Percentage |");
    md.push("|----------------|-------|------------|");
    const sortedKB = Object.entries(statistics.aggregations.by_knowledge_base)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    sortedKB.forEach(([kb, count]) => {
      const percentage = ((count / statistics.total_calls) * 100).toFixed(2);
      md.push(`| ${kb} | ${count} | ${percentage}% |`);
    });
  } else {
    md.push("No knowledge base usage data available.");
  }
  md.push("");

  md.push("## Data Quality Checks");
  md.push("");

  // Phone number validation
  const invalidPhones = calls.filter(
    (c) => !c.customer_phone || c.customer_phone.length < 10,
  );
  md.push(`- **Invalid Phone Numbers:** ${invalidPhones.length} calls`);

  // Unusual durations
  const shortCalls = calls.filter(
    (c) => c.duration_seconds > 0 && c.duration_seconds < 10,
  );
  const longCalls = calls.filter((c) => c.duration_seconds > 1800); // > 30 minutes
  md.push(`- **Unusually Short Calls (< 10s):** ${shortCalls.length} calls`);
  md.push(`- **Unusually Long Calls (> 30m):** ${longCalls.length} calls`);

  // Missing critical fields
  const missingTranscript = calls.filter(
    (c) => c.status === "ended" && !c.transcript,
  );
  const missingSummary = calls.filter(
    (c) => c.status === "ended" && !c.summary,
  );
  const missingCost = calls.filter(
    (c) => c.status === "ended" && (c.cost == null || c.cost === 0),
  );
  md.push(`- **Missing Transcripts:** ${missingTranscript.length} calls`);
  md.push(`- **Missing Summaries:** ${missingSummary.length} calls`);
  md.push(`- **Missing Cost Data:** ${missingCost.length} calls`);

  // Cost outliers
  const costs = calls
    .filter((c) => c.cost != null)
    .map((c) => parseFloat(c.cost));
  if (costs.length > 0) {
    const avgCost = costs.reduce((sum, c) => sum + c, 0) / costs.length;
    const stdDev = Math.sqrt(
      costs.reduce((sum, c) => sum + Math.pow(c - avgCost, 2), 0) /
        costs.length,
    );
    const outliers = calls.filter(
      (c) =>
        c.cost != null && Math.abs(parseFloat(c.cost) - avgCost) > 2 * stdDev,
    );
    md.push(`- **Cost Outliers (> 2 std dev):** ${outliers.length} calls`);
  }
  md.push("");

  md.push("## Recommendations");
  md.push("");
  md.push("Based on the analysis, here are recommendations for optimization:");
  md.push("");

  // Peak time recommendations
  const peakHour = Object.entries(statistics.aggregations.by_hour).sort(
    ([, a], [, b]) => b - a,
  )[0];
  if (peakHour) {
    md.push(
      `1. **Peak Calling Time:** Hour ${peakHour[0]}:00 has the highest volume (${peakHour[1]} calls). Consider scheduling more resources during this time.`,
    );
  }

  // Success rate recommendations
  const successRate = parseFloat(
    statistics.success_metrics.success_evaluation_rate,
  );
  if (successRate < 80) {
    md.push(
      `2. **Success Rate Improvement:** Current success rate is ${statistics.success_metrics.success_evaluation_rate}. Review failed calls to identify improvement opportunities.`,
    );
  }

  // Cost optimization
  const costPerMinute = parseFloat(statistics.cost.per_minute);
  md.push(
    `3. **Cost Optimization:** Current cost per minute is $${statistics.cost.per_minute}. Monitor for cost efficiency and consider optimizing call duration.`,
  );

  // Sentiment recommendations
  const positiveSentimentRate = parseFloat(
    statistics.success_metrics.positive_sentiment_rate,
  );
  if (positiveSentimentRate < 70) {
    md.push(
      `4. **Sentiment Improvement:** Positive sentiment rate is ${statistics.success_metrics.positive_sentiment_rate}. Consider enhancing call scripts or assistant training.`,
    );
  }

  // Data quality recommendations
  if (missingTranscript.length > 0 || missingSummary.length > 0) {
    md.push(
      `5. **Data Quality:** ${missingTranscript.length} calls missing transcripts and ${missingSummary.length} missing summaries. Review webhook processing and data capture.`,
    );
  }

  md.push("");
  md.push("---");
  md.push("");
  md.push(`*Report generated on ${new Date().toISOString()}*`);

  return md.join("\n");
}

// Main execution
async function main() {
  try {
    console.log("Starting VAPI Call Data Comprehensive Analysis...");
    console.log("=".repeat(80));

    // Extract data
    const rawCalls = await extractCallData();

    // Enrich data
    console.log("Enriching call data with calculated fields...");
    const enrichedCalls = enrichCallData(rawCalls);

    // Calculate statistics
    console.log("Calculating aggregated statistics...");
    const statistics = calculateStatistics(enrichedCalls);

    // Create output directory
    const outputDir = join(__dirname, "..", "docs", "vapi", "data");
    mkdirSync(outputDir, { recursive: true });

    // Generate CSV
    console.log("Generating CSV file...");
    const csvContent = generateCSV(enrichedCalls);
    const csvPath = join(outputDir, "vapi_calls_filtered.csv");
    writeFileSync(csvPath, csvContent);
    console.log(`✓ CSV file saved: ${csvPath}`);

    // Generate JSON
    console.log("Generating JSON file...");
    const jsonContent = generateJSON(enrichedCalls, statistics);
    const jsonPath = join(outputDir, "vapi_calls_data.json");
    writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
    console.log(`✓ JSON file saved: ${jsonPath}`);

    // Generate Markdown
    console.log("Generating Markdown report...");
    const mdContent = generateMarkdown(enrichedCalls, statistics);
    const mdPath = join(outputDir, "vapi_calls_analysis.md");
    writeFileSync(mdPath, mdContent);
    console.log(`✓ Markdown report saved: ${mdPath}`);

    console.log("=".repeat(80));
    console.log("Analysis complete!");
    console.log("");
    console.log("Summary:");
    console.log(`  Total Calls: ${statistics.total_calls}`);
    console.log(`  Unique Customers: ${statistics.unique_customers}`);
    console.log(`  Completion Rate: ${statistics.completion_rate}%`);
    console.log(`  Total Cost: $${statistics.cost.total}`);
    console.log(`  Average Duration: ${statistics.duration.average}s`);
    console.log("");
    console.log("Output files:");
    console.log(`  1. ${csvPath}`);
    console.log(`  2. ${jsonPath}`);
    console.log(`  3. ${mdPath}`);
  } catch (error) {
    console.error("Error during analysis:", error);
    process.exit(1);
  }
}

// Run the analysis
main();
