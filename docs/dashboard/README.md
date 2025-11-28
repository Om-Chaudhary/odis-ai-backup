# Dashboard Documentation

> **Purpose:** Centralized documentation for all dashboard features, components, and development  
> **Structure:** Scalable and organized for ongoing development

## 📁 Documentation Structure

```
docs/dashboard/
├── README.md (this file)
│
├── 01-GENERAL/
│   ├── 00-INDEX.md                  # Complete navigation index
│   ├── dashboard-principles.md      # Core design principles
│   ├── design-system.md             # Complete design system
│   ├── DATE_FILTERING_GUIDE.md      # Date filtering guide
│   ├── README_DATE_FILTERING.md     # Date filtering reference
│   ├── DASHBOARD_NAVIGATION.md      # Navigation guide
│   ├── DASHBOARD_ANIMATIONS.md      # Animations guide
│   ├── DASHBOARD_UI_IMPROVEMENTS.md # UI improvements
│   └── DASHBOARD_STANDARDIZATION_SUMMARY.md # Standardization summary
│
├── 02-TABS/
│   ├── overview-tab/
│   │   ├── README.md                # Overview tab documentation
│   │   └── redesign-plan.md         # Current redesign plan
│   ├── cases-tab/
│   │   ├── README.md                # Cases tab documentation
│   │   └── redesign-plan.md         # Current redesign plan
│   └── discharges-tab/
│       ├── README.md                # Discharges tab documentation
│       └── redesign-plan.md         # Current redesign plan
│
├── 03-COMPONENTS/
│   ├── README.md                    # Component catalog index
│   ├── stat-card.md                 # Stat card component
│   ├── date-filter.md               # Date filter component
│   ├── activity-timeline.md         # Activity timeline component
│   └── [component-name].md          # Other components...
│
├── 04-PATTERNS/
│   ├── README.md                    # Pattern library index
│   ├── filtering.md                 # Filter patterns
│   ├── data-display.md              # Data display patterns
│   └── [pattern-name].md            # Other patterns...
│
├── 05-FEATURES/
│   ├── README.md                    # Features index
│   ├── IMPLEMENTATION_ASSIGNMENTS.md # Implementation assignments
│   ├── implement-full-dashboard-layout.plan.md # Layout plan
│   ├── current/                     # Active/current features
│   │   ├── dashboard-optimization/  # Current optimization work
│   │   └── [feature-name]/          # Other active features
│   └── archive/                     # Completed features
│       └── [feature-name]/          # Historical features
│
├── 06-DATA-VIEWS/
│   ├── README.md                    # Data views index
│   ├── soap-note-viewer.md          # SOAP note viewer
│   ├── discharge-summary-viewer.md  # Discharge summary viewer
│   └── transcript-viewer.md         # Transcript viewer
│
├── 07-TESTING/
│   ├── README.md                    # Testing documentation index
│   ├── EXECUTION_PROMPT.md          # Prompt for testing agents
│   ├── strategy.md                  # Testing strategy
│   ├── checklist.md                 # Test checklist
│   ├── results.md                   # Test results
│   └── [testing-guides].md          # Tab-specific and cross-cutting tests
│
├── 08-REPORTS/
│   ├── README.md                    # Reports index
│   ├── STATUS_REPORT.md             # Status report
│   ├── DASHBOARD_IMPLEMENTATION_STATUS.md # Implementation status
│   └── VISUAL_COMPARISON.md         # Visual comparison
│
├── 09-AGENTS/
│   ├── README.md                    # Agent documentation index
│   ├── AGENT_PROGRESS_TRACKER.md    # Agent progress tracking
│   ├── AGENT_QUICK_START.md         # Agent quick start guide
│   └── AGENT_ASSIGNMENT_TEMPLATE.md # Assignment template
│
└── assignments/
    ├── A1-date-filter-button-group.md
    ├── A2-cases-needing-attention-card.md
    └── [A3-A10].md                  # Other assignments
```

## 🎯 How to Use This Documentation

### For Developers

1. **Starting a New Feature:**
   - Create a new directory in `features/current/[feature-name]/`
   - Follow the template in `features/TEMPLATE.md`
   - Link to relevant tabs, components, and patterns

2. **Working on Existing Feature:**
   - Check `features/current/` for active work
   - Review `features/README.md` for feature status
   - Update feature documentation as you work

3. **Creating a New Component:**
   - Document in `03-COMPONENTS/[component-name].md`
   - Add to component library index
   - Follow design system guidelines

4. **Using a Pattern:**
   - Check `04-PATTERNS/` for existing patterns
   - Reference pattern documentation
   - Follow established patterns for consistency

### For Contributors

- **General Dashboard Info:** `01-GENERAL/`
- **Tab-Specific Docs:** `02-TABS/[tab-name]/`
- **Component Reference:** `03-COMPONENTS/`
- **Design Patterns:** `04-PATTERNS/`
- **Feature Work:** `05-FEATURES/current/`
- **Data Views:** `06-DATA-VIEWS/`

## 📋 Documentation Standards

### When to Create New Documentation

**Create a new component doc when:**

- Building a reusable component used across multiple tabs
- Creating a complex component with multiple states
- Establishing a new design pattern

**Create a new feature doc when:**

- Starting a significant new feature or enhancement
- Work spans multiple components or tabs
- Multiple PRs will be needed

**Create a new pattern doc when:**

- Establishing a reusable interaction pattern
- Documenting a design decision
- Creating guidelines for similar features

### Documentation Structure

All documentation should include:

1. **Purpose** - What it does and why
2. **Usage** - How to use it
3. **Examples** - Code examples
4. **Related** - Links to related docs
5. **Status** - Current state (if applicable)

## 🔄 Lifecycle Management

### Feature Lifecycle

1. **Planning** → `features/current/[feature-name]/planning/`
2. **Development** → `features/current/[feature-name]/`
3. **Review** → Update status in feature README
4. **Complete** → Move to `features/archive/[feature-name]/`

### Component Lifecycle

1. **Proposed** → Add to `03-COMPONENTS/` with "Proposed" status
2. **In Development** → Update status
3. **Released** → Mark as stable, add to component library
4. **Deprecated** → Move to archive, document migration path

## 🎨 Design System

The dashboard follows a unified design system documented in:

- **Core Principles:** `01-GENERAL/dashboard-principles.md`
- **Design System:** `01-GENERAL/design-system.md`
- **Component Library:** `01-GENERAL/component-library.md`

All new work should follow these guidelines.

## 🚀 Quick Links

**Start Here:**

- **[Documentation Index](./01-GENERAL/00-INDEX.md)** - Complete navigation index
- **[Testing Documentation](./07-TESTING/README.md)** - Testing guides and results

**Foundational Docs (Read First):**

- [Dashboard Principles](./01-GENERAL/dashboard-principles.md)
- [Design System](./01-GENERAL/design-system.md)

**Current Work:**

- [Dashboard Optimization Feature](./05-FEATURES/current/dashboard-optimization/)
- [Active Features](./05-FEATURES/README.md)
- [Implementation Assignments](./05-FEATURES/IMPLEMENTATION_ASSIGNMENTS.md)

**Status & Reports:**

- [Status Reports](./08-REPORTS/README.md)
- [Agent Progress](./09-AGENTS/AGENT_PROGRESS_TRACKER.md)

**Reference Docs:**

- [Tab Documentation](./02-TABS/README.md)
- [Component Catalog](./03-COMPONENTS/README.md)
- [Data Views](./06-DATA-VIEWS/README.md)
- [Testing Guides](./07-TESTING/README.md)

---

**Maintained by:** Dashboard Team  
**Last Updated:** 2025-11-28  
**Structure Version:** 1.0
