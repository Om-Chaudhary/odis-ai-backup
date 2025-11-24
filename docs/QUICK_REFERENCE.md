# Documentation Quick Reference

Quick lookup guide for finding documentation in the `docs/` folder.

## 🎯 Most Common

| What you need | Where to find it |
|---------------|------------------|
| **API endpoints** | [`api/API_REFERENCE.md`](api/API_REFERENCE.md) |
| **Authentication** | [`api/README.md`](api/README.md) |
| **Daily notes** | [`daily/YYYY-MM-DD/`](daily/) |
| **VAPI setup** | [`vapi/VAPI_FINAL_SETUP.md`](vapi/VAPI_FINAL_SETUP.md) |
| **Testing guide** | [`testing/TESTING_GUIDE.md`](testing/TESTING_GUIDE.md) |

## 📁 By Category

### API & Integration
- **API Reference** → [`api/API_REFERENCE.md`](api/API_REFERENCE.md)
- **API Auth** → [`api/README.md`](api/README.md)
- **Chrome Extension** → [`integrations/EXTENSION_DISCHARGE_INTEGRATION.md`](integrations/EXTENSION_DISCHARGE_INTEGRATION.md)
- **Retell Integration** → [`integrations/RETELL_SCHEDULING_ARCHITECTURE.md`](integrations/RETELL_SCHEDULING_ARCHITECTURE.md)

### VAPI Voice Calls
- **Setup Guide** → [`vapi/VAPI_FINAL_SETUP.md`](vapi/VAPI_FINAL_SETUP.md)
- **Variables** → [`vapi/VAPI_VARIABLES_IMPLEMENTATION.md`](vapi/VAPI_VARIABLES_IMPLEMENTATION.md)
- **Webhooks** → [`vapi/VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md`](vapi/VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md)
- **Knowledge Base** → [`vapi/VAPI_KNOWLEDGE_BASE.md`](vapi/VAPI_KNOWLEDGE_BASE.md)
- **Prompts** → [`vapi/prompts/`](vapi/prompts/)

### Architecture & Design
- **Normalization** → [`architecture/NORMALIZATION_ARCHITECTURE.md`](architecture/NORMALIZATION_ARCHITECTURE.md)
- **Implementation Summary** → [`architecture/IMPLEMENTATION_SUMMARY.md`](architecture/IMPLEMENTATION_SUMMARY.md)
- **Migration Guide** → [`architecture/MIGRATION_GUIDE.md`](architecture/MIGRATION_GUIDE.md)

### Testing
- **Testing Guide** → [`testing/TESTING_GUIDE.md`](testing/TESTING_GUIDE.md)
- **Testing Strategy** → [`testing/TESTING_STRATEGY.md`](testing/TESTING_STRATEGY.md)
- **Quick Start** → [`testing/TESTING_QUICK_START.md`](testing/TESTING_QUICK_START.md)
- **Priority Matrix** → [`testing/TESTING_PRIORITY_MATRIX.md`](testing/TESTING_PRIORITY_MATRIX.md)

### Deployment & Operations
- **Vercel Setup** → [`deployment/VERCEL_SETUP.md`](deployment/VERCEL_SETUP.md)

### Compliance
- **Compliance Guide** → [`compliance/COMPLIANCE_PAGES_GUIDE.md`](compliance/COMPLIANCE_PAGES_GUIDE.md)
- **Quick Start** → [`compliance/QUICK_START_COMPLIANCE.md`](compliance/QUICK_START_COMPLIANCE.md)

### Reference & Migration
- **Migration V2** → [`reference/MIGRATION_V2.md`](reference/MIGRATION_V2.md)

## 🔍 By Task

### Setting up a new feature
1. Check [`architecture/`](architecture/) for design patterns
2. Review [`api/`](api/) for API structure
3. See [`testing/`](testing/) for testing approach

### Integrating with VAPI
1. Start with [`vapi/VAPI_FINAL_SETUP.md`](vapi/VAPI_FINAL_SETUP.md)
2. Review [`vapi/VAPI_VARIABLES_IMPLEMENTATION.md`](vapi/VAPI_VARIABLES_IMPLEMENTATION.md)
3. Configure webhooks: [`vapi/VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md`](vapi/VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md)

### Building API endpoints
1. Read [`api/README.md`](api/README.md) for auth patterns
2. Check [`api/API_REFERENCE.md`](api/API_REFERENCE.md) for examples
3. Follow patterns in [`api/USAGE_EXAMPLES.md`](api/USAGE_EXAMPLES.md)

### Daily development
1. Check [`daily/`](daily/) for recent notes
2. Review [`reference/`](reference/) for migration guides
3. See domain folders for specific features

## 📅 Daily Notes

Daily notes are organized by date in [`daily/YYYY-MM-DD/`](daily/).

**Today's date:** Check the most recent folder in `daily/`

**Finding old notes:** Browse `daily/` folders by date

## 🗂️ Folder Structure

```
docs/
├── daily/          # Date-based notes (YYYY-MM-DD)
├── reference/      # Cross-cutting reference docs
├── api/            # API documentation
├── architecture/   # System design
├── vapi/           # VAPI integration
├── testing/        # Testing guides
├── integrations/   # Third-party integrations
├── compliance/     # Compliance docs
└── deployment/     # Deployment guides
```

## 💡 Tips

- **Start with README.md** in each folder for overview
- **Use search** to find specific topics across all docs
- **Check daily/** for recent changes and decisions
- **Reference docs** are for frequently used guides

---

**See [`README.md`](README.md) for complete documentation structure.**

