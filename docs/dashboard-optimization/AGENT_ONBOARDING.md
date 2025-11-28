# Agent Onboarding Guide - Dashboard Optimization

> **For:** New agents joining the dashboard optimization implementation  
> **Purpose:** Complete context and quick start guide  
> **Status:** Implementation Phase - PR #38 Open

## 🎯 Project Overview

We're implementing dashboard optimization features to improve the user experience with:

1. **Modern Date Filtering** - Replace dropdown with button group
2. **Actionable Metrics** - Add cases needing attention and completion rates
3. **Optimized Layout** - Better information hierarchy and condensed components
4. **Beautiful Data Views** - Transform SOAP notes, discharge summaries, and transcripts

**Repository:** `Odis-AI/odis-ai-web`  
**Current Branch:** `feat/dashboard-optimization-implementation`  
**PR:** [#38 - Dashboard Optimization - Implementation Phase](https://github.com/Odis-AI/odis-ai-web/pull/38)

## 📍 Current Phase: Implementation

**Documentation Status:** ✅ Complete (merged in PR #37)  
**Implementation Status:** 🟡 Ready to Start  
**Next Step:** Begin implementing Phase 1 tasks

### What's Been Done

- ✅ Complete documentation structure created
- ✅ 9 assignments fully specified (A1-A9)
- ✅ Component specifications documented
- ✅ Data models and queries defined
- ✅ Design system guidelines established
- ✅ Execution strategy documented
- ✅ Status tracking file ready

### What's Next

- 🟡 Implement Phase 1 tasks (7 tasks - no dependencies)
- ⏳ Wait for A2 completion (unblocks Phase 2)
- ⏳ Implement Phase 2 tasks (2 tasks after A2)

## 🚀 Quick Start for New Agents

### Step 1: Set Up Your Environment

```bash
# 1. Checkout the implementation branch
git checkout feat/dashboard-optimization-implementation
git pull origin feat/dashboard-optimization-implementation

# 2. Ensure you have latest main
git fetch origin main
```

### Step 2: Review Current Status

Open and read:

- **[STATUS.md](./STATUS.md)** - See which tasks are available/in-progress
- **[EXECUTION_STRATEGY.md](./EXECUTION_STRATEGY.md)** - Understand coordination approach

### Step 3: Choose Your Task

**Available Phase 1 Tasks (No Dependencies):**

1. **A1: Date Filter Button Group** - Easy, 2-3 hours
   - File: `src/components/dashboard/date-range-filter.tsx`
   - [Assignment Doc](./assignments/A1-date-filter-button-group.md)

2. **A2: Backend Metrics Queries** - Medium, 3-4 hours ⚠️ **CRITICAL**
   - File: `src/server/api/routers/dashboard.ts`
   - [Assignment Doc](./assignments/A2-backend-metrics-queries.md)
   - **Blocks Phase 2** - prioritize this if you can

3. **A5: Condensed Activity Timeline** - Medium, 2-3 hours
   - Files: `src/components/dashboard/activity-timeline.tsx`
   - [Assignment Doc](./assignments/A5-condensed-activity-timeline.md)

4. **A6: SOAP Note Viewer** - Hard, 4-5 hours
   - File: `src/components/dashboard/soap-note-viewer.tsx`
   - [Assignment Doc](./assignments/A6-soap-note-viewer.md)

5. **A7: Discharge Summary Viewer** - Hard, 4-5 hours
   - File: `src/components/dashboard/discharge-summary-viewer.tsx`
   - [Assignment Doc](./assignments/A7-discharge-summary-viewer.md)

6. **A8: Transcript Viewer** - Hard, 4-5 hours
   - File: `src/components/dashboard/transcript-viewer.tsx`
   - [Assignment Doc](./assignments/A8-transcript-viewer.md)

7. **A9: Data View Container** - Easy, 2-3 hours
   - File: `src/components/dashboard/data-view-container.tsx`
   - [Assignment Doc](./assignments/A9-data-view-container.md)
   - **Helpful to complete first** - used by A6, A7, A8

### Step 4: Claim Your Task

**Before starting work:**

1. Open `STATUS.md`
2. Find your task in the Phase 1 table
3. Update status to "🟡 In Progress" with your agent ID:
   ```markdown
   | A1 | Date Filter Button Group | YourAgentID | 🟡 In Progress | 2025-11-28 10:00 | - | Starting work |
   ```
4. Commit this change immediately:
   ```bash
   git add docs/dashboard-optimization/STATUS.md
   git commit -m "chore(dashboard): [A1] YourAgentID claiming task"
   git push origin feat/dashboard-optimization-implementation
   ```

**Why claim first?** Prevents multiple agents from working on the same task.

### Step 5: Read Your Assignment Document

**Read these files in order:**

1. **Assignment Document:** `docs/dashboard-optimization/assignments/A[X]-*.md`
   - Complete overview
   - Files to create/modify
   - Implementation details
   - Acceptance criteria
   - Testing checklist

2. **Specification Document:** `docs/dashboard-optimization/specifications/*.md`
   - Visual designs
   - Component props
   - Styling specifications
   - Behavior details

3. **Related Documentation:**
   - Design system: `docs/dashboard-optimization/design-system/`
   - Data models: `docs/dashboard-optimization/data-models/` (if backend work)
   - Implementation guides: `docs/dashboard-optimization/implementation/`

### Step 6: Review Existing Code

Before implementing, understand the patterns:

```bash
# Review similar components
cat src/components/dashboard/date-range-filter.tsx  # For A1
cat src/components/dashboard/activity-timeline.tsx  # For A5
cat src/server/api/routers/dashboard.ts             # For A2

# Review dashboard structure
cat src/components/dashboard/overview-tab.tsx
```

### Step 7: Implement

Follow the assignment guide step-by-step:

- Use existing patterns from the codebase
- Follow code style guidelines: `docs/dashboard-optimization/implementation/code-style.md`
- Match design system: `docs/dashboard-optimization/design-system/`
- Make frequent commits (every logical unit)
- Test incrementally

**Commit Message Format:**

```
feat(dashboard): [A1] implement date filter button group
fix(dashboard): [A1] resolve responsive layout issue
chore(dashboard): [A1] update STATUS.md
```

### Step 8: Verify & Complete

Before marking complete, verify:

- [ ] All acceptance criteria met (from assignment doc)
- [ ] Code compiles: `pnpm typecheck`
- [ ] No linting errors: `pnpm lint`
- [ ] Component renders correctly
- [ ] Responsive design works (test on mobile)
- [ ] Matches design specifications
- [ ] STATUS.md updated

Then update STATUS.md:

```markdown
| A1 | Date Filter Button Group | YourAgentID | 🟢 Complete | 2025-11-28 10:00 | 2025-11-28 12:30 | All acceptance criteria met |
```

Commit and push:

```bash
git add docs/dashboard-optimization/STATUS.md
git commit -m "chore(dashboard): [A1] task complete"
git push
```

## 📋 Task Selection Guide

### If You're the First Agent

**Recommended:** Start with **A2 (Backend Metrics Queries)** - it's critical and unblocks Phase 2

### If Multiple Agents Available

**Priority Order:**

1. **A2** - Critical path (unblocks Phase 2)
2. **A9** - Helpful foundation (used by A6, A7, A8)
3. **A1 or A5** - Quick wins (Easy/Medium)
4. **A6, A7, A8** - Can start in parallel (all use A9)

### Task Difficulty Guide

**Easy (2-3 hours):**

- A1: Date Filter Button Group
- A9: Data View Container

**Medium (2-4 hours):**

- A2: Backend Metrics Queries ⚠️ **Critical**
- A5: Condensed Activity Timeline

**Hard (4-5 hours):**

- A6: SOAP Note Viewer
- A7: Discharge Summary Viewer
- A8: Transcript Viewer

## 🔄 Coordination Protocol

### Branch Strategy

**We're using a single shared branch:**

- Branch: `feat/dashboard-optimization-implementation`
- All agents commit to this branch
- Merge conflicts resolved as they occur

**Before pushing, always pull:**

```bash
git pull origin feat/dashboard-optimization-implementation
# Resolve any conflicts
git push
```

### Status File Coordination

**`STATUS.md` is the single source of truth:**

- ⚪ **Not Started** - Available to claim
- 🟡 **In Progress** - Currently being worked on
- 🟢 **Complete** - Finished and verified
- 🔴 **Blocked** - Waiting on dependency

**Update STATUS.md:**

- When you start a task (change to 🟡)
- When you complete a task (change to 🟢)
- If you get blocked (add note)
- If you finish A2 (unblocks Phase 2)

### Conflict Management

**Known Conflict:**

- A3 and A4 both modify `overview-tab.tsx`
- **Resolution:** A4 completes first (smaller), then A3 merges changes

**If you encounter a conflict:**

1. Check STATUS.md to see who else is modifying the file
2. Pull latest changes: `git pull`
3. Resolve conflicts (usually straightforward - different sections)
4. Test that both features work
5. Commit with clear message

## 📚 Essential Documentation Links

**Quick Reference:**

- [00-OVERVIEW.md](./00-OVERVIEW.md) - Project overview
- [INDEX.md](./INDEX.md) - Complete documentation index
- [QUICK-START.md](./QUICK-START.md) - Getting started guide
- [STATUS.md](./STATUS.md) - Current progress tracker ⭐ **Check this first**
- [EXECUTION_STRATEGY.md](./EXECUTION_STRATEGY.md) - Coordination plan

**Your Assignment:**

- [assignments/README.md](./assignments/README.md) - All assignments index
- `assignments/A[X]-*.md` - Your specific assignment

**Implementation Details:**

- `specifications/*.md` - Component specifications
- `data-models/*.md` - Backend queries/types (for A2)
- `design-system/*.md` - UI/UX guidelines
- `implementation/*.md` - Code style and patterns

## 🛠️ Development Setup

### Prerequisites

```bash
# Install dependencies (if not already done)
pnpm install

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Start dev server (for testing UI changes)
pnpm dev
```

### Code Style

- Follow existing codebase patterns
- TypeScript strict mode
- Functional components
- Use Tailwind CSS for styling
- Match dashboard color scheme (teal #31aba3)
- Use existing UI components from `src/components/ui/`

### State Management

- **URL state:** Use `nuqs` (`useQueryState`)
- **Component state:** Use React hooks (`useState`)
- **Server data:** Use tRPC queries (`api.dashboard.*.useQuery`)

## ✅ Acceptance Criteria Checklist

Every task has specific acceptance criteria. Before marking complete, verify:

**Code Quality:**

- [ ] Code compiles without errors
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Follows code style guidelines

**Functionality:**

- [ ] All acceptance criteria from assignment doc met
- [ ] Component renders correctly
- [ ] Interactive elements work (buttons, toggles, etc.)
- [ ] Responsive design works (mobile + desktop)

**Design:**

- [ ] Matches design specifications
- [ ] Uses correct colors and spacing
- [ ] Consistent with dashboard design system

**Testing:**

- [ ] Manual testing completed
- [ ] Edge cases handled (empty states, missing data)
- [ ] Error states handled gracefully

## 🚨 Common Pitfalls & Solutions

### Issue: "File already modified by another agent"

**Solution:**

- Check STATUS.md to see who's working on it
- If it's a different task, you can usually work in different sections
- If it's the same task, coordinate via STATUS.md notes

### Issue: "Task is blocked on A2"

**Solution:**

- This is for Phase 2 tasks (A3, A4)
- Check STATUS.md - when A2 shows "🟢 Complete", you can start
- Or pick a Phase 1 task instead

### Issue: "Merge conflict when pulling"

**Solution:**

1. Pull latest: `git pull`
2. Resolve conflicts in your editor
3. Usually straightforward (different sections)
4. Test that everything still works
5. Commit: `git commit -m "fix(dashboard): resolve merge conflicts"`

### Issue: "Don't know which task to pick"

**Solution:**

- Check STATUS.md for available tasks (⚪ Not Started)
- If available, pick **A2** (most critical)
- Otherwise, pick **A9** (foundation for data viewers)
- Or pick any Easy task for quick win

## 📞 Getting Help

If you're stuck:

1. **Review Documentation:**
   - Read the assignment doc fully
   - Check specifications
   - Review similar existing components

2. **Check STATUS.md:**
   - See if other agents have notes
   - Check if dependencies are complete

3. **Review Execution Strategy:**
   - See conflict resolution section
   - Check coordination protocols

4. **Look at Existing Code:**
   - Similar components show patterns
   - Existing dashboard code shows structure

## 🎯 Success Indicators

You're on the right track if:

- ✅ STATUS.md updated when you start/complete
- ✅ Small, frequent commits with clear messages
- ✅ Code compiles and lints cleanly
- ✅ Component works as specified
- ✅ Responsive design works
- ✅ Acceptance criteria all met

## 🔗 Quick Links

**GitHub:**

- [PR #38 - Implementation Phase](https://github.com/Odis-AI/odis-ai-web/pull/38)
- [Branch: feat/dashboard-optimization-implementation](https://github.com/Odis-AI/odis-ai-web/tree/feat/dashboard-optimization-implementation)

**Documentation:**

- [Complete Index](./INDEX.md)
- [Execution Strategy](./EXECUTION_STRATEGY.md)
- [Status Tracker](./STATUS.md) ⭐ **Update this!**

---

## 🎬 Your Action Items

1. **Read this entire document** ✅
2. **Checkout the branch:** `git checkout feat/dashboard-optimization-implementation`
3. **Read STATUS.md** to see available tasks
4. **Pick a task** from Phase 1
5. **Claim it** in STATUS.md (update status to 🟡)
6. **Read assignment doc** fully
7. **Start implementing**

**Ready to start?** Go to [STATUS.md](./STATUS.md) and claim your task! 🚀
