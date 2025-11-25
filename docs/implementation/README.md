# Implementation Documentation

This directory contains implementation guides organized by **projects** (ongoing/important work) and **sessions** (date-based implementation notes).

## 📁 Structure

```
docs/implementation/
├── README.md (this file)
├── features/              # Feature implementation documentation
│   └── dual-mode-api/     # Dual-Mode API Architecture feature
│       ├── README.md
│       ├── PARALLEL_TASKS.md
│       └── tasks/
└── sessions/              # Date-based implementation sessions
    └── YYYY-MM-DD/        # Session notes by date
```

## 🚀 Features (`features/`)

**Purpose:** Important, ongoing, or reference feature implementations that need persistent documentation.

**When to use:**

- Major feature implementations
- Architectural changes
- Features that span multiple days/weeks
- Reference documentation for future work

**Structure:**

```
features/[feature-name]/
├── README.md              # Feature overview, goals, timeline
├── PARALLEL_TASKS.md      # Complete task breakdown (if applicable)
├── tasks/                 # Individual task guides
│   ├── TASK_1_*.md
│   └── ...
└── testing/               # Testing guides (optional)
```

### Active Features

#### [Dual-Mode API Architecture](./features/dual-mode-api/)

**Status:** Planning  
**Description:** Replace direct Anthropic SDK calls with LlamaIndex abstraction layer and add orchestration endpoint for multi-step workflows.

**Quick Links:**

- [Feature Overview](./features/dual-mode-api/README.md)
- [Complete Task Breakdown](./features/dual-mode-api/PARALLEL_TASKS.md)
- [Task List](./features/dual-mode-api/tasks/)

## 📅 Sessions (`sessions/`)

**Purpose:** Date-based implementation session notes, similar to `docs/daily/` but focused on implementation work.

**When to use:**

- Daily implementation notes
- Session-specific documentation
- Progress tracking
- Temporary notes that may be archived later

**Structure:**

```
sessions/YYYY-MM-DD/
├── README.md              # Session overview
├── progress.md            # What was accomplished
├── notes.md               # Session notes
└── [project-name]/       # Project-specific session notes
```

**Naming convention:** `YYYY-MM-DD` (ISO format)

## 🔍 Finding Documentation

### By Feature

- Check `features/` for ongoing work
- Each feature has its own README with overview
- Check `STATUS.md` in each feature for progress

### By Date

- Check `sessions/YYYY-MM-DD/` for date-based notes
- Most recent work is in the newest session folder

### By Task Type

- **Foundation/Setup**: Usually Task 1 in each feature
- **Refactoring**: Tasks that modify existing code
- **New Features**: Tasks that add new functionality
- **Testing**: Tasks focused on validation

### Execution Guides

- **Multi-Agent Guide**: [`EXECUTION_GUIDE.md`](./EXECUTION_GUIDE.md) - How to coordinate multiple agents

## 📝 Adding a New Feature

1. **Create feature directory:**

   ```bash
   mkdir -p docs/implementation/features/[feature-name]/tasks
   ```

2. **Create README.md** with:
   - Feature overview
   - Goals and objectives
   - Timeline
   - Task breakdown
   - Success criteria

3. **Break down into tasks** (if complex, create PARALLEL_TASKS.md)

4. **Create task guides** in `tasks/` directory

5. **Update this README** to list the new feature

## 📝 Creating a Session Note

1. **Create session directory:**

   ```bash
   mkdir -p docs/implementation/sessions/YYYY-MM-DD
   ```

2. **Create README.md** with:
   - Date and session overview
   - Projects worked on
   - Key accomplishments
   - Next steps

3. **Link to relevant features** in `features/`

## 🎯 Best Practices

1. **Features for Ongoing Work**: Use `features/` for work that spans multiple sessions
2. **Sessions for Daily Notes**: Use `sessions/` for date-specific progress tracking
3. **Self-Contained Tasks**: Each task guide should have all context needed
4. **Clear Dependencies**: Document what must complete before each task
5. **Parallelization**: Identify tasks that can run in parallel
6. **Testing**: Include testing criteria in each task
7. **Backward Compatibility**: Document breaking changes clearly

## 📚 Related Documentation

- **Architecture**: `docs/architecture/` - System design decisions
- **API**: `docs/api/` - API documentation
- **Testing**: `docs/testing/` - Testing strategies
- **Daily Notes**: `docs/daily/` - General daily notes (broader scope)
- **Sessions**: `docs/implementation/sessions/` - Implementation-specific daily notes

## 🔄 Archiving

### When to Archive Features

- **Completed**: Move to `features/archive/` or mark as complete
- **Cancelled**: Move to `features/archive/` with cancellation notes
- **Superseded**: Archive old version, keep new one active

### When to Archive Sessions

- **After 90 days**: Move to `sessions/archive/YYYY-MM/`
- **After 1 year**: Consider consolidating or removing

---

**Last Updated:** 2025-01-27
