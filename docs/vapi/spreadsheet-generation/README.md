# VAPI Call Data Analysis - December 2025

**Comprehensive Documentation for AI Analysis**

This directory contains the complete VAPI scheduled discharge call dataset and analysis from December 1-7, 2025. These files provide full context for understanding veterinary AI voice call performance.

## Executive Summary

| Metric               | Value              |
| -------------------- | ------------------ |
| **Total Calls**      | 58                 |
| **Unique Customers** | 53                 |
| **Successful Calls** | 26 (44.83%)        |
| **Total Cost**       | $12.93             |
| **Average Duration** | 55 seconds         |
| **Peak Day**         | Friday, December 6 |
| **Peak Hour**        | 4 PM (16:00)       |
| **Top Area Code**    | 408 (San Jose, CA) |

## What This Data Represents

This dataset captures **automated veterinary follow-up calls** made by an AI voice assistant to pet owners after their appointments. The system:

1. Calls pet owners 2-3 hours after their vet visit
2. Checks on the pet's recovery/condition
3. Answers questions about medications, symptoms, or next steps
4. Escalates to clinic staff if concerns are detected

## Files in This Directory

| File                 | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `README.md`          | This overview document                                        |
| `FULL_CONTEXT.md`    | Complete context about the system, data, and business purpose |
| `DATA_ANALYSIS.md`   | Detailed analysis findings and insights                       |
| `FIELD_REFERENCE.md` | All data fields with definitions and valid values             |

## Data Files (in `/docs/vapi/data/`)

| File                                       | Records | Purpose                                  |
| ------------------------------------------ | ------- | ---------------------------------------- |
| `vapi_calls_comprehensive_spreadsheet.csv` | 58      | Full data with summaries and transcripts |
| `vapi_calls_pivot_ready.csv`               | 58      | Numeric codes for analysis               |
| `DATA_DICTIONARY.md`                       | -       | Field definitions                        |

## Key Findings

### Call Outcomes

- **44.83%** marked as successful (manually evaluated by human reviewers as achieving goals)
- **32.76%** completed but not successful (reviewed but didn't meet success criteria)
- **22.41%** failed or other (voicemail, silence timeout, errors - not evaluated)

**Note**: Success evaluation is manual - human reviewers only evaluate calls where users actually picked up (excluding voicemail false positives).

### Timing Patterns

- **62%** of calls on weekdays, **38%** on weekends
- Peak calling time: **4 PM local time**
- After-hours calls had higher silence timeout rates

### Geographic Distribution

- **48%** from 408 area code (San Jose, CA)
- **26%** from 925 area code (Contra Costa County, CA)
- Concentrated in SF Bay Area

### Cost Analysis

- Average cost per call: **$0.22**
- Cost per minute: **$0.24**
- Most expensive call: **$1.12** (4-minute conversation)
- Cheapest call: **$0.01** (under 10 seconds)

---

**Data Period**: December 1-7, 2025  
**Last Updated**: December 8, 2025
