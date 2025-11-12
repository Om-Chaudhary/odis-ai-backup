# Vapi Test Page Documentation

## Overview

The Vapi Test Page is an admin-only testing interface for the OdisAI Follow-Up Assistant. It allows you to test voice calls directly in your browser with custom dynamic variables before deploying to production.

## Location

**URL**: `/admin/vapi-test`
**Access**: Admin users only

## Purpose

This page allows administrators to:
- Test the OdisAI Follow-Up Assistant with custom data
- Preview how the assistant will sound with different pet/owner/clinic information
- Debug assistant behavior and prompts
- Verify variable substitution is working correctly

## Setup

### 1. Get Your Vapi Public Key

1. Log in to [Vapi Dashboard](https://vapi.ai)
2. Navigate to Settings > API Keys
3. Copy your **Public Key** (starts with `pk_`)

### 2. Add to Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_VAPI_PUBLIC_KEY="pk_your_public_key_here"
```

> **Note**: This must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Restart Development Server

```bash
pnpm dev
```

## Usage

### Quick Testing with Preset Scenarios

The easiest way to test is using one of the built-in test scenarios:

1. Navigate to `/admin/vapi-test` in your admin panel
2. Select a test scenario from the **Test Scenario** dropdown:
   - **Discharge - Wellness Exam**: Routine checkup with clean bill of health
   - **Discharge - Vaccination**: Rabies and DHPP vaccines
   - **Follow-Up - GI Issue**: Vomiting/diarrhea with medication
   - **Follow-Up - Post-Surgery**: Spay surgery recovery
   - **Follow-Up - Ear Infection**: Bacterial ear infection treatment
   - **Follow-Up - Limping/Arthritis**: Orthopedic issue with activity restriction
   - **Custom (Manual Entry)**: For custom test cases

3. All fields will auto-populate with realistic test data
4. Modify any fields as needed for your specific test
5. Click **Start Call** to initiate a browser-based voice call
6. Grant microphone permissions when prompted
7. Speak with the assistant to test the conversation flow

### Creating Custom Test Scenarios

1. Select **Custom (Manual Entry)** from the Test Scenario dropdown
2. Fill in all required fields (marked with red asterisk *)
3. Based on the **Call Type** you select, additional fields will appear:
   - **Discharge calls**: Show subType and nextSteps fields
   - **Follow-up calls**: Show condition, medications, nextSteps, and recheckDate fields
4. Click **Start Call** when ready

### Monitoring the Call

The right panel displays:
- **Call Status**: Current connection state (Connecting, Connected, Disconnected)
- **Live Transcript**: Real-time conversation between you and the assistant

### Ending a Call

Click **End Call** at any time to terminate the conversation.

## Dynamic Variables Explained

The assistant uses these variables to personalize the conversation. **All variable names are in camelCase** to match the VAPI system prompt requirements.

### Core Variables (Required for ALL calls)

| Variable | Purpose | Example |
|----------|---------|---------|
| `clinicName` | Clinic for callback reference | "Alum Rock Pet Hospital" |
| `agentName` | Vet tech's first name only | "Sarah" (not "Dr. Sarah") |
| `petName` | Pet's name used throughout conversation | "Bella" |
| `ownerName` | Owner's name for personalization | "John Smith" |
| `appointmentDate` | Spelled-out date for natural speech | "November eighth" (not "11/8") |
| `callType` | Type of call | "discharge" or "follow-up" |
| `clinicPhone` | Clinic phone spelled out | "five five five, two three four, five six seven eight" |
| `emergencyPhone` | Emergency phone spelled out | "five five five, nine one one one, one one one one" |
| `dischargeSummary` | Brief summary completing "{petName} [summary]" | "received a comprehensive wellness exam" |

### Discharge-Specific Variables (Optional)

| Variable | Purpose | Example |
|----------|---------|---------|
| `subType` | Type of discharge visit | "wellness" or "vaccination" |
| `nextSteps` | Follow-up care instructions | "Bella's next wellness visit will be due in about a year" |

### Follow-Up Specific Variables (Optional)

| Variable | Purpose | Example |
|----------|---------|---------|
| `condition` | What the pet was treated for | "vomiting and diarrhea" or "ear infection" |
| `medications` | Prescribed medications | "metronidazole twice daily with food" |
| `recheckDate` | Scheduled follow-up appointment | "November twentieth" (spelled out) |

### Important Formatting Notes

- **Phone Numbers**: Must be spelled out for natural-sounding speech
  - ✅ "five five five, two three four, five six seven eight"
  - ❌ "+1 (555) 234-5678" or "555-234-5678"

- **Dates**: Must be spelled out for natural-sounding speech
  - ✅ "November eighth"
  - ❌ "11/8/2024" or "2024-11-08"

- **Agent Name**: First name only (vet tech making the call)
  - ✅ "Sarah" or "Emma"
  - ❌ "Dr. Sarah" or "Sarah Johnson, DVM"

## Features

### Test Scenario Presets

6 comprehensive preset scenarios covering common veterinary visit types:
- Automatically populate all fields with realistic test data
- Switch between scenarios instantly via dropdown
- Cover both discharge and follow-up call types
- Include all variable types (required and optional)

### Conditional Field Rendering

The form intelligently shows/hides fields based on call type:
- **Discharge calls**: Show subType and nextSteps fields
- **Follow-up calls**: Show condition, medications, and recheckDate fields
- Reduces clutter and confusion during testing
- Ensures only relevant fields are filled

### Real-Time Transcript

The transcript panel shows:
- **Assistant messages**: Displayed on the right with teal background
- **User messages**: Displayed on the left with gray background
- Auto-scrolling to latest message
- Clear role indicators for each message

### Smart Form Validation

- Required fields marked with red asterisk (*)
- Context-sensitive help text for each field
- Placeholder examples showing proper formatting
- Disabled during active calls to prevent mid-call changes

### Debug Panel

Toggle-able debug view showing:
- Complete payload sent to VAPI SDK
- Assistant ID being used
- Variable values in JSON format
- Helpful for troubleshooting variable issues

### Browser-Based Calling

Unlike the production Retell AI integration (which makes phone calls), this test page:
- Uses your browser's microphone
- Doesn't require a phone number
- Provides instant feedback
- Costs less per test
- No need to wait for actual phone connection

## Troubleshooting

### "Vapi public key not configured"

**Solution**: Add `NEXT_PUBLIC_VAPI_PUBLIC_KEY` to your `.env.local` and restart the dev server.

### Microphone Permission Denied

**Solution**: Allow microphone access in your browser settings and refresh the page.

### Call Won't Connect

**Possible causes**:
1. Invalid Vapi public key
2. Assistant ID not found (check that `0309c629-a3f2-43aa-b479-e2e783e564a7` is valid)
3. Network issues blocking WebSocket connections
4. Browser doesn't support Web Audio API (use Chrome/Edge)

### No Transcript Appearing

**Possible causes**:
1. Speech recognition not working (check microphone)
2. Assistant not responding (check Vapi dashboard logs)
3. Console errors (open DevTools to check)

## Technical Details

### Architecture

```
VapiTestPage Component
├── Vapi SDK (@vapi-ai/web)
├── React State Management
│   ├── isConnected: boolean
│   ├── isConnecting: boolean
│   ├── transcript: Array<{role, text}>
│   └── variables: DynamicVariables
└── Event Handlers
    ├── call-start
    ├── call-end
    ├── message (transcript)
    └── error
```

### Key Files

- **Component**: `src/components/admin/vapi-test-page.tsx`
- **Route**: `src/app/admin/vapi-test/page.tsx`
- **Navigation**: `src/app/admin/layout.tsx` (Testing section)

### Vapi Events

The page listens for these events:

- `call-start`: Call successfully connected
- `call-end`: Call terminated
- `speech-start`: User or assistant started speaking
- `speech-end`: User or assistant stopped speaking
- `message`: New transcript message received
- `error`: Connection or call error occurred

## Best Practices

### Before Testing

1. ✅ Verify your Vapi public key is valid
2. ✅ Check that the assistant ID exists in your Vapi dashboard
3. ✅ Ensure your microphone is working
4. ✅ Use headphones to prevent echo

### During Testing

1. 🎤 Speak clearly and at normal volume
2. ⏸️ Wait for the assistant to finish before responding
3. 📝 Watch the transcript to verify understanding
4. 🐛 Check browser console for errors if issues occur

### After Testing

1. 📊 Review the full transcript for accuracy
2. 🔧 Adjust variables and test again if needed
3. 📋 Document any issues found
4. ✅ Verify variable substitution worked correctly

## Production vs Test Differences

| Aspect | Test Page (Vapi) | Production (Retell AI) |
|--------|------------------|------------------------|
| Connection | Browser microphone | Phone call |
| Cost | Lower per test | Standard phone rates |
| Latency | Minimal (WebRTC) | Higher (phone network) |
| Target | Internal testing | Customer calls |
| Recording | Vapi dashboard | Retell dashboard |

## Security Notes

- ⚠️ Admin access only - requires admin role
- 🔒 Public key is safe to expose (browser-side)
- 📞 No actual phone calls are made
- 🎙️ Conversations may be recorded by Vapi (check your Vapi settings)

## Related Documentation

- [Vapi Web SDK Documentation](https://docs.vapi.ai/quickstart/web)
- [OdisAI Follow-Up Assistant Configuration](./RETELL_SETUP.md)
- [Admin Dashboard Overview](./ADMIN.md)

## Support

If you encounter issues not covered here:
1. Check the browser console for errors
2. Review [Vapi documentation](https://docs.vapi.ai)
3. Contact the development team with:
   - Browser version
   - Console errors
   - Steps to reproduce
