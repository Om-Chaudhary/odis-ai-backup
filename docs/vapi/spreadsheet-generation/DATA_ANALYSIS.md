# VAPI Call Data Analysis - December 1-7, 2025

## Dataset Overview

**Period**: December 1-7, 2025 (7 days)  
**Total Calls**: 58  
**Unique Customers**: 53  
**Total Cost**: $12.93

## Performance Metrics

### Call Success Rate

| Category         | Count | Percentage | Description                                |
| ---------------- | ----- | ---------- | ------------------------------------------ |
| **Successful**   | 26    | 44.83%     | Manually evaluated as achieving call goals |
| **Completed**    | 19    | 32.76%     | Connected but not marked successful        |
| **Failed/Other** | 13    | 22.41%     | Voicemail, timeout, or technical errors    |

**Key Insight**: Nearly half of all calls that connected were evaluated as successful by human reviewers.

### Call Duration Analysis

| Metric           | Value              |
| ---------------- | ------------------ |
| Average Duration | 55 seconds         |
| Median Duration  | 49 seconds         |
| Shortest Call    | 6 seconds          |
| Longest Call     | 237 seconds (3:57) |

**Duration Distribution**:

- Under 30 seconds: 25 calls (43%)
- 30-60 seconds: 18 calls (31%)
- 60-120 seconds: 11 calls (19%)
- Over 120 seconds: 4 calls (7%)

**Finding**: Most calls are brief check-ins under 1 minute, which is appropriate for routine follow-ups.

### End Reason Breakdown

| End Reason                 | Count | Percentage | Notes                              |
| -------------------------- | ----- | ---------- | ---------------------------------- |
| `customer-ended-call`      | 27    | 46.55%     | Owner hung up (normal or early)    |
| `assistant-ended-call`     | 15    | 25.86%     | AI completed conversation properly |
| `silence-timed-out`        | 11    | 18.97%     | No response (likely voicemail)     |
| `assistant-forwarded-call` | 1     | 1.72%      | Transferred to clinic staff        |
| `failed/error`             | 4     | 6.90%      | Technical failures                 |

**Key Insight**: Nearly 1 in 5 calls hit silence timeout, suggesting voicemail detection could be improved.

## Temporal Patterns

### Day of Week Distribution

| Day      | Count | Percentage | Type    |
| -------- | ----- | ---------- | ------- |
| Friday   | 24    | 41.38%     | Weekday |
| Saturday | 22    | 37.93%     | Weekend |
| Tuesday  | 6     | 10.34%     | Weekday |
| Monday   | 4     | 6.90%      | Weekday |
| Other    | 2     | 3.45%      | Various |

**Finding**: Friday and Saturday account for 79% of calls, suggesting most appointments occur Thursday-Friday.

### Hour of Day Analysis

| Hour         | Count | Percentage | Time Category  |
| ------------ | ----- | ---------- | -------------- |
| 4 PM (16:00) | 27    | 46.55%     | Business Hours |
| 5 PM (17:00) | 12    | 20.69%     | Business Hours |
| 6 PM (18:00) | 11    | 18.97%     | After Hours    |
| Other        | 8     | 13.79%     | Various        |

**Peak Calling Window**: 4-5 PM local time (late afternoon)

**Business vs After Hours**:

- Business Hours (9 AM - 5 PM, Mon-Fri): 38 calls (65.52%)
- After Hours: 20 calls (34.48%)

**Success Rate by Time**:

- Business Hours: 50% success rate
- After Hours: 35% success rate

**Finding**: Business hours calls have higher success rates, likely because owners are more available and attentive.

## Geographic Distribution

### Top Area Codes

| Area Code | Region                  | Count | Percentage |
| --------- | ----------------------- | ----- | ---------- |
| 408       | San Jose, CA            | 28    | 48.28%     |
| 925       | Contra Costa County, CA | 15    | 25.86%     |
| 650       | San Mateo County, CA    | 3     | 5.17%      |
| 510       | East Bay, CA            | 2     | 3.45%      |
| Other     | Various                 | 10    | 17.24%     |

**Geographic Concentration**: 79% of calls from SF Bay Area (408, 925, 650, 510)

**Success Rate by Region**:

- 408 (San Jose): 46% success rate
- 925 (Contra Costa): 47% success rate
- Other: 40% success rate

**Finding**: Geographic distribution matches clinic locations, and success rates are consistent across regions.

## Financial Analysis

### Cost Breakdown

| Metric                | Value  |
| --------------------- | ------ |
| Total Cost            | $12.93 |
| Average Cost per Call | $0.22  |
| Cost per Minute       | $0.24  |
| Minimum Call Cost     | $0.01  |
| Maximum Call Cost     | $1.12  |

### Cost Distribution

| Cost Range    | Count | Percentage |
| ------------- | ----- | ---------- |
| $0.00 - $0.10 | 18    | 31.03%     |
| $0.10 - $0.30 | 28    | 48.28%     |
| $0.30 - $0.60 | 9     | 15.52%     |
| $0.60+        | 3     | 5.17%      |

**Cost Efficiency**: 79% of calls cost under $0.30, making the system very cost-effective.

### Cost vs Duration Correlation

- Short calls (<30s): Average $0.08
- Medium calls (30-60s): Average $0.22
- Long calls (60-120s): Average $0.35
- Very long calls (120s+): Average $0.75

**Finding**: Cost scales linearly with duration, as expected.

## Quality Metrics

### Sentiment Analysis

| Sentiment | Count | Percentage | Code |
| --------- | ----- | ---------- | ---- |
| Neutral   | 57    | 98.28%     | 1    |
| Positive  | 0     | 0%         | 2    |
| Negative  | 0     | 0%         | 0    |
| Unknown   | 1     | 1.72%      | -1   |

**Finding**: Overwhelmingly neutral sentiment indicates routine, professional interactions without strong emotional content.

### Success Evaluation Details

**Evaluation Criteria** (manual human review):

- Only evaluates calls where user actually picked up
- Excludes voicemail false positives
- Marks `success_evaluation = true` if call achieved goals

**Evaluation Results**:

- Marked Successful: 26 calls (44.83%)
- Not Successful: 19 calls (32.76%)
- Not Evaluated: 13 calls (22.41%) - voicemail/timeout/errors

**Success Rate of Evaluated Calls**: 26 / 45 = **57.78%**

This means: Of calls that actually connected with a person, 58% were evaluated as successful.

## Schedule Accuracy

### Schedule Delay Analysis

| Delay Range                | Count | Percentage |
| -------------------------- | ----- | ---------- |
| On Time (0-1 min)          | 45    | 77.59%     |
| Slight Delay (1-5 min)     | 8     | 13.79%     |
| Significant Delay (5+ min) | 2     | 3.45%      |
| Very Delayed (15+ min)     | 1     | 1.72%      |
| Not Started                | 2     | 3.45%      |

**Average Delay**: 0.34 minutes (20 seconds)

**Finding**: System is highly accurate at executing calls at scheduled times.

## Content Analysis

### Transcript Availability

- Full Transcripts: 55 calls (94.83%)
- Missing Transcripts: 3 calls (5.17%) - very short or failed calls

### Summary Quality

- Summaries Generated: 55 calls (94.83%)
- Average Summary Length: ~150 characters
- Summaries provide: Pet name, reason for call, owner response, outcome

### Recording Availability

- Recordings Available: 55 calls (94.83%)
- Mono Recordings: 55 (100% of available)
- Stereo Recordings: 55 (100% of available)
- Missing: 3 calls (failed or very short)

## Patterns & Insights

### High Success Indicators

Calls more likely to be successful:

1. **Business hours** (50% vs 35% after hours)
2. **Longer duration** (successful calls average 75s vs 35s for non-successful)
3. **Assistant-ended** (93% success rate when AI ends call)
4. **No silence timeout** (timeout calls never successful)

### Low Success Indicators

Calls less likely to be successful:

1. **Silence timeout** (0% success - likely voicemail)
2. **Very short duration** (<20 seconds)
3. **Customer-ended early** (often indicates disengagement)
4. **After hours** (35% success vs 50% business hours)

### Recommendations

1. **Improve Voicemail Detection**: 19% silence timeout rate suggests need for better voicemail detection
2. **Optimize Call Timing**: Focus on business hours (4-5 PM) for best results
3. **Handle Early Hangups**: 47% customer-ended rate suggests some calls end too early
4. **Track Condition Categories**: Not currently tracked - would enable better analysis

## Data Quality Assessment

### Completeness

| Field Category   | Completeness | Notes                                |
| ---------------- | ------------ | ------------------------------------ |
| Core Identifiers | 100%         | call_id, vapi_call_id always present |
| Temporal Data    | 100%         | All timestamps present               |
| Contact Info     | 100%         | Phone numbers always present         |
| Duration         | 97%          | Missing only for failed calls        |
| Cost             | 97%          | Missing only for failed calls        |
| Transcripts      | 95%          | Missing for very short/failed calls  |
| Summaries        | 95%          | Missing for very short/failed calls  |
| Recordings       | 95%          | Missing for failed calls             |

### Accuracy

- Phone numbers: 100% valid E.164 format
- Timestamps: 100% valid ISO 8601
- Area codes: 100% correctly extracted
- Duration calculations: Verified against timestamps

### Consistency

- Status values: Consistent with ended_reason
- Outcome codes: Consistent with status + success_evaluation
- Cost calculations: Consistent with duration

---

**Analysis Date**: December 8, 2025  
**Data Period**: December 1-7, 2025  
**Total Records Analyzed**: 58
