# Dashboard Tabs Documentation

> **Purpose:** Documentation for each dashboard tab/section

## 📑 Available Tabs

### Overview Tab

**Route:** `/dashboard?tab=overview`  
**Purpose:** High-level metrics, actionable insights, and recent activity

- [Overview Tab Documentation](./overview-tab/README.md)
- [Current Redesign Plan](./overview-tab/redesign-plan.md)

### Cases Tab

**Route:** `/dashboard?tab=cases`  
**Purpose:** Browse, search, and manage all veterinary cases

- [Cases Tab Documentation](./cases-tab/README.md)
- [Current Redesign Plan](./cases-tab/redesign-plan.md)

### Discharges Tab

**Route:** `/dashboard?tab=discharges`  
**Purpose:** Manage automated discharge calls and emails

- [Discharges Tab Documentation](./discharges-tab/README.md)
- [Current Redesign Plan](./discharges-tab/redesign-plan.md)

## 📋 Adding a New Tab

When adding a new dashboard tab:

1. **Create Tab Directory:**

   ```bash
   mkdir -p 02-TABS/[tab-name]
   ```

2. **Create Documentation:**
   - `README.md` - Tab overview, purpose, and usage
   - `redesign-plan.md` or `specification.md` - If redesigning
   - Add component docs if tab-specific

3. **Update This Index:**
   - Add entry with route and purpose
   - Link to documentation

4. **Follow Standards:**
   - Use design system from `01-GENERAL/design-system.md`
   - Follow patterns from `04-PATTERNS/`
   - Use shared components from `03-COMPONENTS/`

---

**Last Updated:** 2025-11-28
