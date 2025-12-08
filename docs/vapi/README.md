# VAPI Integration Documentation

This directory contains comprehensive documentation for the VAPI (Voice AI Platform Integration) system used for automated veterinary discharge and follow-up calls.

## Quick Navigation

### Setup & Configuration

- [**VAPI_FINAL_SETUP.md**](./VAPI_FINAL_SETUP.md) - Complete setup guide for VAPI integration
- [**VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md**](./VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md) - Webhook implementation details
- [**VAPI_WEBHOOK_CHECKLIST.md**](./VAPI_WEBHOOK_CHECKLIST.md) - Setup verification checklist
- [**CALL_TRANSFER_SETUP.md**](./CALL_TRANSFER_SETUP.md) - Call transfer configuration

### Voice AI Assistant Configuration

- [**VAPI_ASSISTANT_PROMPT.md**](./VAPI_ASSISTANT_PROMPT.md) - Assistant prompt design
- [**VAPI_PROMPT_FILES.md**](./VAPI_PROMPT_FILES.md) - Prompt file management
- [**prompts/**](./prompts/) - Directory containing prompt templates

### Dynamic Variables System

- [**VAPI_VARIABLES_IMPLEMENTATION.md**](./VAPI_VARIABLES_IMPLEMENTATION.md) - Variable implementation guide
- [**VAPI_DYNAMIC_VARIABLES_COMPLETE.md**](./VAPI_DYNAMIC_VARIABLES_COMPLETE.md) - Complete variable reference
- [**VAPI_VARIABLE_MAPPING.md**](./VAPI_VARIABLE_MAPPING.md) - Variable mapping specifications
- [**VAPI_AI_EXTRACTION_VARIABLES.md**](./VAPI_AI_EXTRACTION_VARIABLES.md) - AI extraction variable definitions
- [**VARIABLE_USAGE_ANALYSIS.md**](./VARIABLE_USAGE_ANALYSIS.md) - Variable usage patterns

### Knowledge Base System

- [**VAPI_KNOWLEDGE_BASE.md**](./VAPI_KNOWLEDGE_BASE.md) - Knowledge base architecture
- [**VAPI_KNOWLEDGE_BASE_USAGE.md**](./VAPI_KNOWLEDGE_BASE_USAGE.md) - Usage patterns and best practices

### Testing & Validation

- [**ENRICHED_CALL_TESTING_GUIDE.md**](./ENRICHED_CALL_TESTING_GUIDE.md) - Testing procedures for enriched calls

### Voicemail Detection

- [**VOICEMAIL_DETECTION.md**](./VOICEMAIL_DETECTION.md) - Voicemail detection overview
- [**VOICEMAIL_DETECTION_SETUP.md**](./VOICEMAIL_DETECTION_SETUP.md) - Setup instructions
- [**VOICEMAIL_DETECTION_IMPLEMENTATION.md**](./VOICEMAIL_DETECTION_IMPLEMENTATION.md) - Implementation details
- [**VOICEMAIL_HANGUP_IMPLEMENTATION.md**](./VOICEMAIL_HANGUP_IMPLEMENTATION.md) - Automatic hangup on voicemail

### Data Analysis & Extraction

- [**VAPI_DATA_EXTRACTION_META_PROMPT.md**](./VAPI_DATA_EXTRACTION_META_PROMPT.md) - Meta prompt for data extraction
- [**VAPI_DATA_EXTRACTION_SUMMARY.md**](./VAPI_DATA_EXTRACTION_SUMMARY.md) - Latest extraction summary (Dec 1-7, 2025)
- [**VAPI_CALLS_ANALYSIS.md**](./VAPI_CALLS_ANALYSIS.md) - Call analysis overview
- [**data/**](./data/) - Directory containing extracted call data

### Integration Summaries

- [**VAPI_AI_EXTRACTION_INTEGRATION_SUMMARY.md**](./VAPI_AI_EXTRACTION_INTEGRATION_SUMMARY.md) - AI extraction integration overview

## Data Files

The `data/` directory contains extracted and analyzed VAPI call data:

### Latest Dataset (December 1-7, 2025)

- **[vapi_calls_data.json](./data/vapi_calls_data.json)** (686 KB)
  - Complete call records with all fields
  - Aggregated statistics and metrics
  - 58 calls with full metadata

- **[vapi_calls_filtered.csv](./data/vapi_calls_filtered.csv)** (39 KB)
  - Spreadsheet-compatible format
  - 24 columns covering all key metrics
  - Easy to import into Excel, Google Sheets, or BI tools

- **[vapi_calls_analysis.md](./data/vapi_calls_analysis.md)** (3.6 KB)
  - Human-readable analysis report
  - Key findings and recommendations
  - Performance metrics and insights

## System Architecture

### Call Flow Overview

```
1. Schedule Call (Dashboard/API)
   ↓
2. Store in Database (scheduled_discharge_calls)
   ↓
3. QStash Scheduling (future execution)
   ↓
4. Execute Call (VAPI API)
   ↓
5. Real-time Updates (Webhooks)
   ↓
6. Store Results (Database)
   ↓
7. Analysis & Reporting
```

### Key Components

#### 1. Database Tables

- `scheduled_discharge_calls` - Primary call records
- `vapi_calls` (legacy) - Historical reference
- Related tables for cases, users, clinics

#### 2. API Routes

- `/api/calls/schedule` - Schedule new calls
- `/api/calls/execute` - Execute scheduled calls
- `/api/webhooks/vapi` - Receive VAPI updates
- `/api/webhooks/execute-call` - QStash webhook

#### 3. VAPI Configuration

- **Assistant ID**: Defines conversation behavior
- **Phone Number ID**: Outbound caller ID
- **Dynamic Variables**: 40+ context variables per call
- **Knowledge Base**: Domain-specific veterinary knowledge

#### 4. Core Libraries

- `src/lib/vapi/client.ts` - VAPI SDK wrapper
- `src/lib/vapi/validators.ts` - Input validation
- `src/lib/vapi/types.ts` - TypeScript definitions
- `src/lib/vapi/knowledge-base/` - Veterinary knowledge domains

## Dynamic Variables System

VAPI calls are personalized using 40+ dynamic variables:

### Core Variables

- `pet_name`, `owner_name`, `vet_name`
- `clinic_name`, `clinic_phone`, `emergency_phone`
- `appointment_date`, `call_type`

### Clinical Context

- `diagnoses`, `primary_diagnosis`, `condition_category`
- `medications`, `vaccinations`, `lab_results`
- `discharge_summary`, `next_steps`, `clinical_notes`

### Assessment Framework

- `assessment_questions` - Structured question array
- `urgent_criteria` - Warning signs array
- `emergency_criteria` - Emergency signs array

See [VAPI_DYNAMIC_VARIABLES_COMPLETE.md](./VAPI_DYNAMIC_VARIABLES_COMPLETE.md) for full reference.

## Knowledge Base Domains

Specialized veterinary knowledge organized by medical domain:

- **Behavioral** - Training and behavior issues
- **Cardiac** - Heart conditions
- **Dental** - Dental procedures and care
- **Dermatological** - Skin conditions
- **Endocrine** - Diabetes, thyroid
- **Gastrointestinal** - Digestive issues
- **Neurological** - Seizures, neurological
- **Ophthalmic** - Eye conditions
- **Orthopedic** - Bone and joint
- **Pain Management** - Pain protocols
- **Post-Surgical** - Post-op care
- **Respiratory** - Breathing issues
- **Urinary** - Urinary tract
- **Wound Care** - Wound management

Location: `src/lib/vapi/knowledge-base/`

## Data Extraction

### Running a Data Extraction

Use the comprehensive analysis script:

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export SUPABASE_SERVICE_ROLE_KEY="your_key"

# Run extraction
node scripts/vapi_comprehensive_analysis.js
```

### Output Files

The script generates three files in `docs/vapi/data/`:

1. **CSV** - Spreadsheet format for data analysis
2. **JSON** - Complete data with statistics
3. **Markdown** - Human-readable report

### Extraction Configuration

See [VAPI_DATA_EXTRACTION_META_PROMPT.md](./VAPI_DATA_EXTRACTION_META_PROMPT.md) for:

- Filtering criteria
- Field definitions
- Aggregation methods
- Output formats

## Latest Analysis Results (Dec 1-7, 2025)

### Key Metrics

- **Total Calls:** 58
- **Unique Customers:** 53
- **Completion Rate:** 93.10%
- **Success Rate:** 96.55%
- **Average Duration:** 57 seconds
- **Total Cost:** $12.93
- **Cost per Minute:** $0.24

### Geographic Distribution

- **408 (San Jose):** 48.28%
- **925 (Contra Costa):** 25.86%
- **650 (San Mateo):** 5.17%

### Peak Times

- **Peak Day:** Friday (41.38%)
- **Peak Hour:** 4 PM (46.55%)
- **Business Hours:** 65.52%
- **Weekends:** 32.76%

### Call Outcomes

- **Customer Ended:** 46.55%
- **Assistant Ended:** 25.86%
- **Silence Timeout:** 18.97%
- **Failed/Error:** 8.62%

See [VAPI_DATA_EXTRACTION_SUMMARY.md](./VAPI_DATA_EXTRACTION_SUMMARY.md) for complete analysis.

## Quality Metrics

### Current Performance

- **Success Evaluation:** 96.55% marked successful
- **Sentiment Analysis:** 98.28% neutral sentiment
- **Data Completeness:** 100% for core fields
- **Phone Validation:** 100% valid numbers

### Areas for Improvement

1. **Condition Categories** - 100% missing, needs implementation
2. **Knowledge Base Tracking** - Not currently tracked
3. **Sentiment Detection** - Needs more granularity
4. **Short Call Rate** - 8.62% under 10 seconds

## Integration Points

### IDEXX Integration

- Transform IDEXX Neo discharge data into VAPI variables
- Automatic field mapping and formatting
- See `src/lib/idexx/transformer.ts`

### QStash Scheduling

- Schedule calls for future execution
- Automatic retry with exponential backoff
- Webhook-based execution

### Supabase Database

- Real-time call tracking
- Historical data storage
- Performance metrics

### PostHog Analytics

- Call event tracking
- User behavior analysis
- Performance monitoring

## Testing

### Test Call Procedure

1. Use Quick Call Dialog in dashboard
2. Provide test phone number
3. Fill in pet/owner information
4. Select call type and timing
5. Monitor in Calls tab
6. Review transcript and recording

### Test Checklist

- [ ] Call connects successfully
- [ ] Dynamic variables populate correctly
- [ ] Knowledge base accessed appropriately
- [ ] Voicemail detected and handled
- [ ] Transcript captured accurately
- [ ] Cost calculated correctly
- [ ] Webhook updates received
- [ ] Database records updated

See [ENRICHED_CALL_TESTING_GUIDE.md](./ENRICHED_CALL_TESTING_GUIDE.md) for detailed procedures.

## Common Issues & Solutions

### Issue: Calls not connecting

**Solution:** Check phone number format (+1XXXXXXXXXX)

### Issue: Variables not populating

**Solution:** Verify dynamic_variables JSON structure

### Issue: Voicemail detection failing

**Solution:** Check voicemail detection settings in assistant config

### Issue: High silence timeout rate

**Solution:** Review call timing (business hours vs after hours)

### Issue: Missing transcripts

**Solution:** Verify webhook is receiving end-of-call-report events

## Environment Variables

Required environment variables:

```bash
# VAPI Configuration
VAPI_PRIVATE_KEY="your_private_key"
VAPI_ASSISTANT_ID="your_assistant_id"
VAPI_PHONE_NUMBER_ID="your_phone_number_id"
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your_public_key"
VAPI_WEBHOOK_SECRET="your_webhook_secret"

# QStash
QSTASH_TOKEN="your_token"
QSTASH_CURRENT_SIGNING_KEY="your_key"
QSTASH_NEXT_SIGNING_KEY="your_next_key"

# Site
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

## Development Workflow

### Adding New Features

1. Update assistant prompt in VAPI dashboard
2. Add new dynamic variables if needed
3. Update knowledge base files
4. Test with Quick Call Dialog
5. Monitor webhooks and database
6. Document changes

### Modifying Variables

1. Update TypeScript types in `src/lib/vapi/types.ts`
2. Update validators in `src/lib/vapi/validators.ts`
3. Update transformer if IDEXX integration affected
4. Test with sample data
5. Update documentation

### Knowledge Base Updates

1. Edit relevant domain file in `src/lib/vapi/knowledge-base/`
2. Follow existing FAQ/instruction format
3. Test assistant responses
4. Update version in prompt

## Monitoring & Analytics

### Key Metrics to Track

- Call volume trends
- Success/completion rates
- Average call duration
- Cost per call/minute
- Customer sentiment
- Geographic distribution
- Peak calling times
- Error rates

### Dashboard Features

- Real-time call status
- Transcript viewing
- Recording playback
- Cost tracking
- Filter by date/status
- Export capabilities

## Best Practices

### Call Scheduling

- Schedule during business hours for best results
- Allow 2-3 hours after appointment
- Avoid early morning/late evening
- Consider customer timezone

### Variable Population

- Provide complete pet information
- Include all relevant diagnoses
- Add detailed discharge instructions
- Specify follow-up requirements

### Quality Assurance

- Review first calls manually
- Monitor sentiment trends
- Check for common failures
- Update knowledge base regularly
- Refine assistant prompts

## Support & Resources

### Internal Resources

- Main CLAUDE.md in repo root
- Dashboard documentation: `/docs/dashboard/`
- API documentation: `/docs/api/`

### External Resources

- VAPI Documentation: https://docs.vapi.ai
- VAPI Dashboard: https://dashboard.vapi.ai
- QStash Console: https://console.upstash.com/qstash
- Supabase Dashboard: https://supabase.com/dashboard

## Version History

### Current Implementation

- **Version:** 2.0 (VAPI-based)
- **Migration Date:** November 2025
- **Previous System:** Retell AI (deprecated)

### Recent Updates

- **Dec 7, 2025:** Comprehensive data extraction and analysis
- **Dec 4, 2025:** Call transfer setup
- **Dec 2, 2025:** Voicemail detection implementation
- **Nov 29, 2025:** Variable mapping updates
- **Nov 27, 2025:** Enriched call testing guide
- **Nov 23, 2025:** Initial VAPI integration

## Contributing

When updating VAPI documentation:

1. **Follow naming convention:** VAPI_DESCRIPTION.md
2. **Update this README:** Add entry in appropriate section
3. **Cross-reference:** Link related documents
4. **Include examples:** Code snippets and use cases
5. **Test changes:** Verify with actual calls
6. **Update date:** Note last update date in document

## License

This documentation is part of the ODIS AI Web project and is proprietary.

---

**Last Updated:** December 7, 2025
**Maintainer:** ODIS AI Development Team
**Contact:** support@odisai.net
