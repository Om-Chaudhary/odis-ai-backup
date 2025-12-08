# VAPI Calls Data Export - File Index

**Generated**: December 7, 2025  
**Data Period**: December 1-7, 2025  
**Total Records**: 58 calls

## Primary Data Files

### CSV Exports

| File                                         | Size | Records      | Purpose                                           |
| -------------------------------------------- | ---- | ------------ | ------------------------------------------------- |
| **vapi_calls_comprehensive_spreadsheet.csv** | 55KB | 58 + summary | Complete data for detailed analysis and reporting |
| **vapi_calls_pivot_ready.csv**               | 12KB | 58           | Optimized for pivot tables and BI tools           |
| vapi_calls_filtered.csv                      | 39KB | 155          | (Previous export - different date range)          |

### Documentation Files

| File                   | Size        | Content                                  |
| ---------------------- | ----------- | ---------------------------------------- |
| **README.md**          | 11KB        | Overview, import instructions, use cases |
| **DATA_DICTIONARY.md** | 12KB        | Complete field reference and definitions |
| **QUICK_REFERENCE.md** | 6.5KB       | Quick lookup for codes and common tasks  |
| **INDEX.md**           | (this file) | File directory and navigation            |

### Analysis Files

| File                                  | Size  | Content                        |
| ------------------------------------- | ----- | ------------------------------ |
| **VAPI_CALLS_SPREADSHEET_SUMMARY.md** | 12KB  | Executive summary and insights |
| vapi_calls_analysis.md                | 3.6KB | (Earlier analysis)             |
| SAMPLE_QUERIES.md                     | 14KB  | SQL query examples             |

## Quick Navigation

**I want to...**

- **Import data into Excel/Sheets** → Start with README.md
- **Understand what fields mean** → See DATA_DICTIONARY.md
- **Create pivot tables** → Use vapi_calls_pivot_ready.csv + README.md pivot examples
- **Review business insights** → Read VAPI_CALLS_SPREADSHEET_SUMMARY.md
- **Look up field codes quickly** → Check QUICK_REFERENCE.md
- **See all call details** → Open vapi_calls_comprehensive_spreadsheet.csv

## File Relationships

```
Main Exports:
├── vapi_calls_comprehensive_spreadsheet.csv
│   ├── 30 columns with full text fields
│   ├── Summaries and transcript previews
│   ├── Recording URLs
│   └── Summary statistics at bottom
│
└── vapi_calls_pivot_ready.csv
    ├── 22 columns with numeric codes
    ├── Optimized for aggregation
    └── Pre-calculated counts

Documentation:
├── README.md (Start here for importing)
├── DATA_DICTIONARY.md (Field reference)
├── QUICK_REFERENCE.md (Quick lookups)
└── VAPI_CALLS_SPREADSHEET_SUMMARY.md (Insights)

Scripts:
└── /scripts/generate_vapi_spreadsheet.cjs (Generator)
```

## Key Features by File

### vapi_calls_comprehensive_spreadsheet.csv

- ✓ Title section with date range
- ✓ 30 comprehensive columns
- ✓ Text summaries (200 char)
- ✓ Transcript previews (200 char)
- ✓ Recording URLs (mono + stereo)
- ✓ Cumulative cost tracking
- ✓ Summary statistics section
- ✓ Human-readable formats

### vapi_calls_pivot_ready.csv

- ✓ Numeric codes for all categories
- ✓ Simplified column names
- ✓ Date/time separated
- ✓ Pre-calculated counts
- ✓ Optimized for grouping
- ✓ BI tool compatible
- ✓ Statistical analysis ready

### README.md

- ✓ Column reference tables
- ✓ Import instructions (Excel, Sheets, Python, R)
- ✓ Pivot table examples
- ✓ Use case guidance
- ✓ Summary statistics
- ✓ Calculation formulas

### DATA_DICTIONARY.md

- ✓ All 40+ field definitions
- ✓ Data types and formats
- ✓ Valid value ranges
- ✓ Calculated field formulas
- ✓ Relationship diagrams
- ✓ Quality rules
- ✓ Export format differences

### QUICK_REFERENCE.md

- ✓ Numeric code cheat sheet
- ✓ Common filter examples
- ✓ Quick calculation formulas
- ✓ Pivot table templates
- ✓ Import quick steps
- ✓ Top insights summary

### VAPI_CALLS_SPREADSHEET_SUMMARY.md

- ✓ Executive summary
- ✓ Key performance metrics
- ✓ Temporal pattern analysis
- ✓ Geographic distribution
- ✓ Cost analysis
- ✓ Business recommendations
- ✓ Usage instructions

## Data Summary

### Period Coverage

- **Start**: December 1, 2025 00:00:00 UTC
- **End**: December 7, 2025 23:59:59 UTC
- **Duration**: 7 days

### Record Counts

- **Total Calls**: 58
- **Unique Customers**: 53
- **Successful**: 26 (44.83%)
- **Completed**: 19 (32.76%)
- **Failed/Other**: 13 (22.41%)

### Financial

- **Total Cost**: $12.93
- **Average Cost**: $0.22 per call
- **Cost Range**: $0.08 - $1.12

### Temporal

- **Peak Day**: Friday, December 6
- **Peak Hour**: 4 PM (16:00)
- **Weekday Calls**: 36 (62%)
- **Weekend Calls**: 22 (38%)

### Geographic

- **Top Area Code**: 408 (San Jose, CA)
- **Unique Area Codes**: 23
- **SF Bay Area**: 63.8% of calls

## Technical Details

### Generator Script

**Location**: `/scripts/generate_vapi_spreadsheet.cjs`

**Capabilities**:

- Extracts data from Supabase
- Calculates 15+ derived fields
- Generates both CSV formats
- Computes summary statistics
- Proper CSV escaping

**Regenerate**:

```bash
node scripts/generate_vapi_spreadsheet.cjs
```

### Data Source

- **Database**: Supabase PostgreSQL
- **Table**: `scheduled_discharge_calls`
- **Query**: All records where `created_at` between Dec 1-7, 2025

### File Formats

- **CSV Encoding**: UTF-8
- **Line Endings**: Unix (LF)
- **Delimiter**: Comma (,)
- **Quote Character**: Double quote (")
- **Escape Method**: Double-quote escaping

## Version History

**v1.0 - December 7, 2025**

- Initial comprehensive export
- 58 records from Dec 1-7, 2025
- Dual-format CSVs (comprehensive + pivot)
- Complete documentation suite
- Analysis summary with recommendations

## Support Resources

**Need Help?**

| Question                   | Resource                          |
| -------------------------- | --------------------------------- |
| What does this field mean? | DATA_DICTIONARY.md                |
| How do I import this?      | README.md                         |
| What are the key insights? | VAPI_CALLS_SPREADSHEET_SUMMARY.md |
| Quick code lookup?         | QUICK_REFERENCE.md                |
| Where do I start?          | README.md or this file            |

## Recommended Reading Order

1. **INDEX.md** (this file) - Orientation
2. **QUICK_REFERENCE.md** - Quick overview
3. **README.md** - Import and usage
4. **vapi_calls_comprehensive_spreadsheet.csv** - Explore data
5. **VAPI_CALLS_SPREADSHEET_SUMMARY.md** - Business insights
6. **DATA_DICTIONARY.md** - Deep reference (as needed)

## Related Files

**Parent Directory** (`/docs/vapi/`):

- VAPI_CALLS_ANALYSIS.md - Earlier analysis
- VAPI_CALLS_SPREADSHEET_SUMMARY.md - Main summary doc
- Other VAPI documentation

**Scripts Directory** (`/scripts/`):

- generate_vapi_spreadsheet.cjs - CSV generator
- vapi_analysis.js - Analysis scripts

## Next Steps

1. **Import Data**: Follow README.md import instructions
2. **Explore**: Open comprehensive CSV in Excel/Sheets
3. **Analyze**: Create pivot tables from pivot CSV
4. **Act**: Implement recommendations from summary doc
5. **Monitor**: Regenerate weekly to track improvements

---

**Last Updated**: December 7, 2025  
**Data Freshness**: Current as of generation date  
**Regeneration**: Run script to update with latest data
