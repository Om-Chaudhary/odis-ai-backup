# VAPI Call System - Full Context

## Business Overview

### What is ODIS AI?

ODIS AI is a veterinary technology platform that automates post-appointment follow-up calls using AI voice assistants. The system helps veterinary clinics:

1. **Improve patient outcomes** by checking on pets after procedures
2. **Reduce staff workload** by automating routine follow-up calls
3. **Increase client satisfaction** through proactive communication
4. **Identify urgent issues** early before they become emergencies

### The VAPI Integration

VAPI (Voice AI Platform Integration) powers the outbound voice calls. Each call:

- Uses natural language AI to have conversations
- Follows veterinary-specific protocols
- Records transcripts and summaries
- Tracks outcomes and sentiment
- Can transfer to human staff if needed

## Call Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CALL LIFECYCLE                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. SCHEDULING                                                       │
│     └─ Call scheduled 2-3 hours after appointment                   │
│                                                                      │
│  2. EXECUTION                                                        │
│     └─ VAPI initiates outbound call at scheduled time               │
│                                                                      │
│  3. CONVERSATION                                                     │
│     ├─ AI introduces itself as clinic assistant                     │
│     ├─ Asks about pet's condition/recovery                          │
│     ├─ Answers questions using veterinary knowledge base            │
│     └─ Offers to transfer to clinic if concerns detected            │
│                                                                      │
│  4. COMPLETION                                                       │
│     ├─ AI provides clinic contact info                              │
│     └─ Transcript and recording saved                               │
│                                                                      │
│  5. EVALUATION                                                       │
│     └─ Human reviewers evaluate calls (manual process)             │
│        • Only evaluates calls where user picked up                  │
│        • Excludes voicemail false positives                         │
│        • Marks success_evaluation = true/false                     │
│                                                                      │
│  6. ANALYSIS                                                         │
│     └─ Data aggregated for reporting and optimization               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Clinics in Dataset

This dataset includes calls from two veterinary clinics:

### 1. Alum Rock Animal Hospital

- **Location**: San Jose, CA (408 area code)
- **Type**: Full-service veterinary clinic
- **Call Volume**: Majority of calls in dataset

### 2. Del Valle Pet Hospital

- **Location**: Livermore, CA (925 area code)
- **Type**: Full-service veterinary clinic
- **Call Volume**: Smaller portion of dataset

## Call Types

### Discharge Calls (Primary)

- Made after routine appointments
- Check on pet's condition post-visit
- Confirm medication understanding
- Answer questions about care instructions

### Follow-Up Calls

- Made after specific treatments/procedures
- Monitor recovery from surgery
- Check medication effectiveness
- Assess symptom improvement

## Call Outcomes Explained

### Success Evaluation Process

**IMPORTANT**: `success_evaluation` is a **manual human evaluation**, not automatic.

Human reviewers evaluate calls by:

1. Listening to recordings or reading transcripts
2. Only evaluating calls where the user actually picked up (not voicemail)
3. Excluding false positives (voicemail detected as pickup)
4. Marking `success_evaluation = true` if the call achieved its goals

### Successful (44.83%)

Calls where human reviewers marked `success_evaluation = true`. These calls:

- Had meaningful conversation with pet owner
- Successfully checked on pet's condition
- Answered questions or provided value
- Concluded naturally without issues

### Completed (32.76%)

Calls that connected and ended normally, but reviewers marked `success_evaluation = false` or left unmarked. Common reasons:

- Owner was busy, conversation too brief
- Owner already had questions resolved elsewhere
- Call ended before all questions could be asked
- Inconclusive health assessment
- Owner seemed rushed or disengaged

### Failed/Other (22.41%)

The call did not complete normally:

- **Silence Timeout**: No response detected (likely voicemail)
- **Customer Ended Early**: Owner hung up quickly
- **Technical Error**: Connection failed
- **Voicemail Detected**: System detected voicemail greeting

## End Reason Categories

| Reason                     | Description                         | Percentage |
| -------------------------- | ----------------------------------- | ---------- |
| `customer-ended-call`      | Owner hung up (normal or early)     | 46.55%     |
| `assistant-ended-call`     | AI completed conversation properly  | 25.86%     |
| `silence-timed-out`        | No audio detected, likely voicemail | 18.97%     |
| `assistant-forwarded-call` | Transferred to clinic staff         | 1.72%      |
| `failed/error`             | Technical failure                   | 6.90%      |

## Sentiment Analysis

The AI analyzes customer sentiment during calls:

| Sentiment | Code | Description                        | Percentage |
| --------- | ---- | ---------------------------------- | ---------- |
| Positive  | 2    | Owner expressed satisfaction       | ~1%        |
| Neutral   | 1    | Standard, unemotional conversation | ~98%       |
| Negative  | 0    | Owner expressed frustration        | ~1%        |

**Note**: The high neutral rate indicates most conversations are routine check-ins without strong emotional content.

## Cost Structure

VAPI charges based on:

- **Duration**: Per-second billing
- **AI Processing**: LLM inference costs
- **Telephony**: Phone connection costs
- **Transcription**: Speech-to-text costs

### Cost Breakdown (Estimated)

- Average call cost: $0.22
- Cost per minute: $0.24
- Minimum (short call): $0.01
- Maximum (long call): $1.12

## Time Analysis

### Business Hours Definition

- **Business Hours**: Monday-Friday, 9 AM - 5 PM
- **After Hours**: Evenings, weekends, holidays

### Findings

- 65% of calls during business hours
- 35% after hours (evenings/weekends)
- Higher success rate during business hours
- More silence timeouts after hours

## Geographic Context

### Area Code Distribution

| Area Code | Region                  | Percentage |
| --------- | ----------------------- | ---------- |
| 408       | San Jose, CA            | 48.3%      |
| 925       | Contra Costa County, CA | 25.9%      |
| 650       | San Mateo County, CA    | 5.2%       |
| 510       | East Bay, CA            | 3.4%       |
| Other     | Various                 | 17.2%      |

Most customers are in the **San Francisco Bay Area**, matching the clinic locations.

## Technical Details

### Phone Number Format

All phone numbers use **E.164 format**: `+1XXXXXXXXXX`

- Country code: +1 (USA)
- 10-digit national number
- No formatting characters

### Recording Storage

- Format: WAV (16-bit PCM)
- Mono and Stereo versions available
- Storage: VAPI cloud (30-day retention)
- URLs provided for playback

### Transcript Format

- AI messages prefixed with "AI:"
- User messages prefixed with "User:"
- Timestamps available in detailed view
- Summary generated by AI post-call

## Data Quality Notes

### Complete Fields (100%)

- call_id, vapi_call_id
- customer_phone, area_code
- status, created_at
- duration_seconds (for completed)

### Partially Complete

- summary: 95% (missing for very short calls)
- transcript: 95% (missing for very short calls)
- recording_url: 95% (missing for failed calls)

### Missing/Not Tracked

- condition_category: 0% (not implemented yet)
- knowledge_base_used: 0% (not tracked)

## Business Impact

### Value Delivered

1. **Staff Time Saved**: ~1 hour/day of follow-up calls
2. **Client Touchpoints**: 58 additional contacts in one week
3. **Issue Detection**: 2 calls resulted in same-day callbacks
4. **Cost Efficiency**: $12.93 for 58 calls (~$0.22 each)

### Areas for Improvement

1. Reduce silence timeout rate (currently 19%)
2. Improve call timing (avoid early morning)
3. Add voicemail message leaving
4. Track condition categories for analysis
