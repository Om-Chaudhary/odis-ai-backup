---
sidebar_position: 2
title: Discharge Calls
description: Automate post-visit follow-up calls
---

# Discharge Calls

Automate post-visit follow-up calls to check on patients and remind owners about medications.

## Overview

Discharge calls are automated outbound calls made after a patient visit to:

- Check on the patient's recovery
- Remind owners about medication schedules
- Answer any follow-up questions
- Schedule follow-up appointments if needed

## Setting Up Discharge Calls

### 1. Configure Call Schedule

Set when discharge calls should be made:

```json
{
  "discharge_call_config": {
    "delay_hours": 24,
    "call_window": {
      "start": "09:00",
      "end": "18:00"
    },
    "max_attempts": 3,
    "retry_delay_hours": 4
  }
}
```

### 2. Customize the Script

Discharge call scripts are customizable per visit type:

**Post-Surgery Call:**

```
"Hi, this is ODIS calling from [Clinic Name]. I'm following up on
[Pet Name]'s surgery yesterday. How is [he/she] doing today?"
```

**Wellness Visit Call:**

```
"Hi, this is ODIS calling from [Clinic Name]. I wanted to check
how [Pet Name] is doing after [his/her] wellness visit."
```

### 3. Enable for Visit Types

Select which visit types trigger discharge calls:

- ✅ Surgery
- ✅ Dental procedures
- ✅ Sick visits
- ⬜ Routine vaccinations (optional)
- ⬜ Grooming (optional)

## Call Flow

1. **Initial Greeting** - Identify clinic and purpose
2. **Patient Check** - Ask about pet's condition
3. **Medication Reminder** - Review any prescribed medications
4. **Questions** - Allow owner to ask questions
5. **Follow-up** - Schedule appointment if needed
6. **Closing** - Thank owner and end call

## Handling Voicemail

When a call goes to voicemail:

```
"Hi, this is ODIS calling from [Clinic Name] to check on [Pet Name]
after [his/her] visit. Please call us back at [Phone] if you have
any questions. Hope [Pet Name] is doing well!"
```

## Analytics

Track discharge call performance:

- **Completion Rate** - Calls successfully completed
- **Voicemail Rate** - Calls that went to voicemail
- **Average Duration** - Length of successful calls
- **Follow-up Scheduled** - Appointments booked during calls
- **Issues Reported** - Concerns raised by owners
