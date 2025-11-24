# Documentation Structure

This directory contains all project documentation organized by purpose and frequency of use.

## 📁 Directory Structure

```
docs/
├── daily/              # Date-based daily notes and session logs
├── reference/         # Frequently referenced documentation
├── api/               # API documentation and guides
├── architecture/      # System architecture and design docs
├── compliance/        # Compliance and legal documentation
├── deployment/        # Deployment guides and setup
├── integrations/      # Third-party integration guides
├── testing/           # Testing guides and strategies
├── vapi/              # VAPI voice call integration docs
└── README.md          # This file
```

---

## 📅 Daily Notes (`daily/`)

**Purpose:** Date-based notes, session logs, and temporary documentation.

**Structure:** Organized by date (YYYY-MM-DD format)

**Examples:**
- `daily/2025-11-02/` - Notes from November 2, 2025
- `daily/2025-11-24/` - Today's notes

**When to use:**
- Daily standup notes
- Session-specific documentation
- Temporary notes that may be archived later
- Date-specific implementation notes

**Naming convention:** `YYYY-MM-DD/` or `YYYY-MM-DD-description/`

---

## 📚 Reference Documentation (`reference/`)

**Purpose:** Frequently referenced guides and documentation that don't fit into specific domains.

**Contents:**
- Migration guides
- Implementation summaries
- Quick start guides
- General project documentation

**Examples:**
- `MIGRATION_V2.md` - Migration guide for v2
- `IMPLEMENTATION_SUMMARY.md` - High-level implementation overview
- `TESTING_STRATEGY.md` - Testing approach

**When to use:**
- Documentation you reference regularly
- Guides that span multiple domains
- General project knowledge

---

## 🔌 API Documentation (`api/`)

**Purpose:** Complete API reference and integration guides.

**Key Files:**
- `API_REFERENCE.md` - Complete API reference (start here)
- `README.md` - API authentication and overview
- `USAGE_EXAMPLES.md` - Code examples
- `chrome-extension-api-reference.md` - Extension-specific API docs

**Subdirectories:**
- `endpoints/` - Individual endpoint documentation (auto-generated)

**When to use:**
- Integrating with the API
- Understanding authentication
- Finding endpoint details
- Extension development

---

## 🏗️ Architecture (`architecture/`)

**Purpose:** System design, architecture decisions, and technical deep-dives.

**Contents:**
- System architecture diagrams
- Design decisions
- Migration guides
- Normalization architecture

**When to use:**
- Understanding system design
- Planning major changes
- Onboarding new developers

---

## ✅ Compliance (`compliance/`)

**Purpose:** Legal, compliance, and regulatory documentation.

**Contents:**
- Compliance page guides
- Legal requirements
- Privacy documentation

**When to use:**
- Building compliance features
- Understanding legal requirements
- Privacy policy updates

---

## 🚀 Deployment (`deployment/`)

**Purpose:** Deployment guides and infrastructure setup.

**Contents:**
- Vercel setup guides
- Environment configuration
- CI/CD documentation

**When to use:**
- Setting up new environments
- Deploying to production
- Configuring infrastructure

---

## 🔗 Integrations (`integrations/`)

**Purpose:** Third-party integration guides and documentation.

**Contents:**
- Chrome extension integration
- Retell AI scheduling
- IDEXX integration
- Other third-party services

**When to use:**
- Integrating with external services
- Understanding integration architecture
- Troubleshooting integrations

---

## 🧪 Testing (`testing/`)

**Purpose:** Testing guides, strategies, and best practices.

**Contents:**
- Testing strategy
- Testing guides
- Priority matrices
- Quick start guides

**When to use:**
- Writing tests
- Understanding test coverage
- Planning test strategy

---

## 📞 VAPI (`vapi/`)

**Purpose:** VAPI voice call integration documentation.

**Contents:**
- Integration guides
- Variable documentation
- Webhook guides
- Knowledge base docs
- Prompts (`prompts/` subdirectory)

**When to use:**
- Setting up VAPI calls
- Understanding dynamic variables
- Configuring webhooks
- Updating prompts

---

## 📝 Quick Reference

### Where to find...

| What you need | Where to look |
|---------------|---------------|
| API endpoints | `api/API_REFERENCE.md` |
| Daily notes | `daily/YYYY-MM-DD/` |
| Migration guides | `reference/MIGRATION_*.md` |
| Architecture decisions | `architecture/` |
| Testing guides | `testing/` |
| VAPI setup | `vapi/VAPI_FINAL_SETUP.md` |
| Deployment | `deployment/` |
| Compliance | `compliance/` |

### Adding new documentation

1. **Daily notes:** Create `daily/YYYY-MM-DD/` directory
2. **API docs:** Add to `api/` or `api/endpoints/`
3. **Reference docs:** Add to `reference/`
4. **Domain-specific:** Add to appropriate domain folder (`vapi/`, `testing/`, etc.)

### Documentation standards

- **Markdown format:** All docs use `.md` extension
- **Naming:** Use UPPER_SNAKE_CASE for files, descriptive names
- **Structure:** Include table of contents for long docs
- **Links:** Use relative paths for cross-references
- **Dates:** Use ISO format (YYYY-MM-DD) for date-based docs

---

## 🔍 Finding Documentation

### By Topic

- **Authentication:** `api/README.md`
- **Database:** `architecture/NORMALIZATION_ARCHITECTURE.md`
- **Voice Calls:** `vapi/`
- **Chrome Extension:** `integrations/EXTENSION_DISCHARGE_INTEGRATION.md`
- **Testing:** `testing/TESTING_GUIDE.md`

### By Date

- Check `daily/` for date-based notes
- Most recent changes are in the newest `daily/` folder

### By Type

- **Guides:** Look in domain folders (`api/`, `vapi/`, etc.)
- **Reference:** Check `reference/`
- **Daily:** Check `daily/`

---

## 📋 Maintenance

### Regular Tasks

- **Weekly:** Archive old daily notes (move to `daily/archive/`)
- **Monthly:** Review and update reference docs
- **Quarterly:** Audit documentation structure

### Cleanup

- Remove outdated docs from `daily/` after 90 days
- Update links when moving files
- Keep `reference/` focused on frequently used docs

---

**Last Updated:** November 24, 2025

