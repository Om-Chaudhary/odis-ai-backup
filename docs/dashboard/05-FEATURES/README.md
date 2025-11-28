# Dashboard Features

> **Purpose:** Track all dashboard features, both current and completed

## 📋 Current Features

Active features being developed:

### Dashboard Optimization (Current)

**Status:** 🟡 In Progress  
**PR:** [#38](https://github.com/Odis-AI/odis-ai-web/pull/38)  
**Location:** `features/current/dashboard-optimization/`

**Description:** Comprehensive dashboard redesign focusing on actionable metrics, improved UX, and standardized components.

**Components:**

- Date filter button group
- Enhanced stat cards
- Cases needing attention card
- Condensed activity timeline
- Beautiful data viewers (SOAP notes, discharge summaries, transcripts)

**Documentation:**

- [Feature Overview](./current/dashboard-optimization/00-OVERVIEW.md)
- [Status Tracking](./current/dashboard-optimization/STATUS.md)
- [Assignments](./current/dashboard-optimization/assignments/)
- [Agent Onboarding](./current/dashboard-optimization/AGENT_ONBOARDING.md)

---

## 📚 Completed Features

Features that have been completed and merged:

### (None yet - this section will grow as features complete)

---

## 🆕 Starting a New Feature

When starting a new dashboard feature:

1. **Create Feature Directory:**

   ```bash
   mkdir -p features/current/[feature-name]
   ```

2. **Create Feature README:**
   - Copy from template: `features/TEMPLATE.md`
   - Document purpose, scope, and status
   - Link to related tabs/components

3. **Add to This Index:**
   - Add entry under "Current Features"
   - Include status, PR link, and description

4. **Document as You Go:**
   - Create docs for new components
   - Update tab documentation if needed
   - Follow design system guidelines

5. **When Complete:**
   - Move to `features/archive/[feature-name]`
   - Update status to completed
   - Add completion date

---

## 📐 Feature Template

See `TEMPLATE.md` for the standard feature documentation template.

---

**Last Updated:** 2025-11-28
