---
sidebar_position: 3
title: IDEXX Neo Setup
description: Connect ODIS AI to IDEXX Neo
---

# IDEXX Neo Setup

Integrate ODIS AI with IDEXX Neo to sync patient data, appointments, and medical records.

## Prerequisites

- IDEXX Neo account with API access
- Administrator credentials
- ODIS AI dashboard access

## Setup Steps

### Step 1: Generate API Credentials

1. Log in to IDEXX Neo as an administrator
2. Navigate to **Settings → API Access**
3. Click **Generate New Credentials**
4. Copy the Client ID and Client Secret

### Step 2: Configure in ODIS AI

1. Go to [ODIS Dashboard](https://odis.ai/dashboard)
2. Navigate to **Settings → Integrations**
3. Select **IDEXX Neo**
4. Enter your credentials:

```
Client ID: your_client_id
Client Secret: your_client_secret
Practice ID: your_practice_id
```

5. Click **Connect**

### Step 3: Map Data Fields

Configure how ODIS AI maps data to IDEXX Neo fields:

| ODIS Field | IDEXX Neo Field      |
| ---------- | -------------------- |
| Owner Name | client.name          |
| Phone      | client.phone_primary |
| Pet Name   | patient.name         |
| Species    | patient.species      |
| Visit Type | appointment.type     |

### Step 4: Test the Connection

1. Click **Test Connection**
2. Verify patient search works
3. Create a test appointment
4. Confirm it appears in IDEXX Neo

## Sync Options

### Real-time Sync

- Appointments sync immediately
- Recommended for active use

### Scheduled Sync

- Sync at specific intervals
- Useful for high-volume clinics

```json
{
  "sync_mode": "realtime",
  "sync_interval_minutes": 5,
  "sync_fields": ["appointments", "clients", "patients"]
}
```

## Troubleshooting

### Connection Failed

- Verify credentials are correct
- Check API access is enabled in IDEXX Neo
- Ensure your IP is whitelisted

### Data Not Syncing

- Check sync mode is enabled
- Verify field mapping is correct
- Review error logs in dashboard

### Duplicate Records

- Enable duplicate detection
- Set matching rules (phone, email, pet name)
