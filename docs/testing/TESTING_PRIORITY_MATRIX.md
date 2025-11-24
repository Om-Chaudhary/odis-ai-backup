# Testing Priority Matrix

Visual guide for what to test and in what order.

---

## Priority Quadrants

```
                    HIGH BUSINESS IMPACT
                            │
                            │
        P1: HIGH PRIORITY   │   P0: CRITICAL
        ────────────────────┼────────────────────
        • IDEXX Transformer │   • VAPI Webhooks
        • Zod Validators    │   • Authentication
        • tRPC Routers      │   • Call Scheduling
        • Server Actions    │   • Retry Logic
────────────────────────────┼────────────────────────── HIGH COMPLEXITY
        • Business Hours    │   • VAPI Client
        • UI Components     │   • QStash Client
        • React Hooks       │   • Supabase RLS
        • Utils             │   • Integration Tests
        ────────────────────┼────────────────────
        P3: NICE TO HAVE    │   P2: IMPORTANT
                            │
                    LOW BUSINESS IMPACT
```

---

## Test First (P0 - Critical)

### 🚨 Critical Path: Revenue-Generating Features

| Test File                                  | Lines of Code | Complexity | Risk     | Est. Time |
| ------------------------------------------ | ------------- | ---------- | -------- | --------- |
| `src/app/api/webhooks/vapi/route.test.ts`  | ~480          | Very High  | CRITICAL | 6h        |
| `src/app/api/calls/schedule/route.test.ts` | ~280          | High       | CRITICAL | 7h        |
| `src/server/actions/auth.test.ts`          | ~150          | Medium     | CRITICAL | 4h        |

**Total P0 Effort**: ~17 hours (2 days)

**Why These First?**:

- **Webhook handler**: 480 lines with complex retry logic = highest bug risk
- **Call scheduling**: Entry point for all calls = breaks everything if broken
- **Auth**: Security + data access = must be bulletproof

**Success Criteria**:

- [ ] All webhook event types covered (status-update, end-of-call-report, hang)
- [ ] Retry logic verified (exponential backoff, max retries, retry reasons)
- [ ] QStash rollback tested
- [ ] Auth flows tested (sign up, sign in, sign out, getUser)
- [ ] Admin role checks verified

---

## Test Second (P1 - High Priority)

### 📊 High-Impact Data Pipelines

| Test File                              | Lines of Code | Complexity | Risk | Est. Time |
| -------------------------------------- | ------------- | ---------- | ---- | --------- |
| `src/lib/idexx/transformer.test.ts`    | ~200          | Medium     | HIGH | 4h        |
| `src/lib/retell/validators.test.ts`    | ~250          | Low        | HIGH | 3h        |
| `src/lib/vapi/validators.test.ts`      | ~460          | Medium     | HIGH | 6h        |
| `src/server/api/routers/cases.test.ts` | ~480          | Medium     | HIGH | 8h        |

**Total P1 Effort**: ~21 hours (2.5 days)

**Why These Second?**:

- **Transformers**: Bad data in = bad calls out
- **Validators**: Data integrity gates
- **tRPC routers**: Admin dashboard depends on these

**Success Criteria**:

- [ ] All IDEXX transformations tested
- [ ] Voice formatting verified (dates, phone numbers)
- [ ] All Zod schemas validated
- [ ] Edge cases covered (missing fields, invalid formats)
- [ ] All tRPC procedures tested (list, get, update, delete, bulk)

---

## Test Third (P2 - Important)

### 🔧 Infrastructure & Integration

| Test File                                             | Lines of Code | Complexity | Risk   | Est. Time |
| ----------------------------------------------------- | ------------- | ---------- | ------ | --------- |
| `src/lib/vapi/client.test.ts`                         | ~260          | Medium     | MEDIUM | 4h        |
| `src/lib/qstash/client.test.ts`                       | ~90           | Low        | MEDIUM | 2h        |
| `src/lib/utils/business-hours.test.ts`                | ~140          | Low        | MEDIUM | 3h        |
| `src/components/dashboard/quick-call-dialog.test.tsx` | ~670          | Medium     | MEDIUM | 5h        |

**Total P2 Effort**: ~14 hours (1.5 days)

**Why These Third?**:

- **VAPI/QStash clients**: External API wrappers (less logic)
- **Business hours**: Important but localized impact
- **UI components**: User-facing but lower risk

**Success Criteria**:

- [ ] API call mocking verified
- [ ] Error handling tested
- [ ] Timezone logic verified
- [ ] User interactions tested

---

## Test Last (P3 - Nice to Have)

### 🎨 Polish & Coverage

| Test File                                | Complexity | Est. Time |
| ---------------------------------------- | ---------- | --------- |
| `src/hooks/use-toast.test.ts`            | Low        | 1h        |
| `src/hooks/use-media-query.test.ts`      | Low        | 1h        |
| `src/lib/utils.test.ts`                  | Very Low   | 1h        |
| `src/lib/utils/phone-formatting.test.ts` | Low        | 1h        |
| Remaining UI components                  | Medium     | 5h        |

**Total P3 Effort**: ~9 hours (1 day)

**Why These Last?**:

- Simple utilities with low risk
- UI components with good visual testing
- Hooks already well-tested

---

## Week-by-Week Plan

### Week 1: Critical Path (P0)

```
Mon-Tue: VAPI Webhook Handler (6h)
Wed:     Call Scheduling API (7h)
Thu:     Authentication (4h)
Fri:     Review + integration testing
```

**Deliverable**: Core revenue features tested (40% coverage)

---

### Week 2: High-Impact (P1 Part 1)

```
Mon:     IDEXX Transformer (4h)
Tue:     Retell Validators (3h)
Wed-Thu: VAPI Validators (6h)
Fri:     Start tRPC Routers (2h of 8h)
```

**Deliverable**: Data pipelines tested (55% coverage)

---

### Week 3: High-Impact (P1 Part 2)

```
Mon-Wed: Finish tRPC Routers (6h remaining)
Thu:     Review + bug fixes
Fri:     Integration testing
```

**Deliverable**: Admin dashboard tested (65% coverage)

---

### Week 4: Infrastructure (P2)

```
Mon:     VAPI Client (4h)
Tue:     QStash Client (2h) + Business Hours (3h)
Wed-Thu: Quick Call Dialog (5h)
Fri:     Review + polish
```

**Deliverable**: 70% coverage target achieved

---

## Risk Heatmap

### 🔴 Extreme Risk (Test Immediately)

- VAPI webhook retry logic
- Call scheduling QStash integration
- Authentication RLS

### 🟠 High Risk (Test Within Week 1-2)

- IDEXX data transformation
- Dynamic variable validation
- Admin tRPC procedures

### 🟡 Medium Risk (Test Within Week 3-4)

- VAPI client API calls
- Business hours calculations
- UI form validation

### 🟢 Low Risk (Test Anytime)

- Utility functions (cn, formatters)
- Simple hooks
- Styling logic

---

## Coverage Progression

```
Week 0: ████░░░░░░░░░░░░░░░░  5% (current)
Week 1: ████████░░░░░░░░░░░░ 40% (P0 complete)
Week 2: ███████████░░░░░░░░░ 55% (P1 part 1)
Week 3: █████████████░░░░░░░ 65% (P1 complete)
Week 4: ██████████████░░░░░░ 70% (P2 complete)
        └────────────────────┘
        Target: 70%
```

---

## Daily Checklist

### Before Starting Each Test File

- [ ] Read the source file completely
- [ ] Identify critical paths and edge cases
- [ ] Create fixtures for test data
- [ ] Set up mocks for external dependencies
- [ ] Write tests in AAA pattern (Arrange, Act, Assert)
- [ ] Aim for descriptive test names
- [ ] Run tests in watch mode (`pnpm test:watch`)

### After Completing Each Test File

- [ ] Verify all critical paths covered
- [ ] Check coverage report (`pnpm test:coverage`)
- [ ] Review for flaky tests (run 3x to verify)
- [ ] Commit with descriptive message
- [ ] Update this checklist

---

## Quick Wins (30 mins each)

If you have spare time, knock out these quick tests:

1. ✅ **Phone formatting** (`src/lib/utils/phone-formatting.test.ts`)
   - Simple string manipulation
   - No external dependencies
   - High value for coverage %

2. ✅ **Date formatting** (`src/lib/utils/date-grouping.test.ts`)
   - Pure functions
   - Easy to test
   - No mocks needed

3. ✅ **cn utility** (`src/lib/utils.test.ts`)
   - Already has test structure from landing page
   - 1-liner function
   - Instant coverage boost

---

## Red Flags to Watch For

### 🚩 Test Smells

- **Tests passing when they shouldn't**: Check your mocks
- **Flaky tests**: Use vi.useFakeTimers() for time-dependent tests
- **Slow tests**: Mock external APIs, don't make real calls
- **Duplicate setup**: Extract to beforeEach or test utilities

### 🚩 Coverage Traps

- **100% coverage ≠ bug-free**: Focus on critical paths
- **Mocking too much**: Test real integration where safe
- **Testing implementation**: Test behavior, not internals
- **Ignoring edge cases**: Empty arrays, null, undefined, malformed data

---

## Success Metrics

### Quantitative

- [ ] 70% line coverage
- [ ] 70% branch coverage
- [ ] 350+ total tests
- [ ] All P0 tests passing
- [ ] CI/CD green

### Qualitative

- [ ] Critical paths 100% covered
- [ ] Retry logic thoroughly tested
- [ ] Auth flows verified
- [ ] Data transformations validated
- [ ] No known high-risk areas without tests

---

## Emergency Priorities

**If you only have 1 day**:

1. VAPI webhook handler (6h)

**If you only have 3 days**:

1. VAPI webhook handler (6h)
2. Call scheduling (7h)
3. Authentication (4h)

**If you only have 1 week**:

- Complete all of P0 (Week 1 plan)

---

**Start Here**: `src/app/api/webhooks/vapi/route.test.ts`

**Why?**: 480 lines of complex retry logic + highest business risk

**Next**: `src/app/api/calls/schedule/route.test.ts`

**Why?**: Entry point for all calls + QStash integration
