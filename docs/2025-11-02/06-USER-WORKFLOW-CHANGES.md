# User Workflow Changes: Template Creation & Sharing

**Date:** 2025-11-02
**Features:** ODIS-134 (Template Sharing), ODIS-135 (Case Sharing)
**Impact:** High - Changes how users collaborate on templates and cases

---

## Table of Contents

1. [Overview](#overview)
2. [Before: Template Creation (No Sharing)](#before-template-creation-no-sharing)
3. [After: Template Creation with Sharing](#after-template-creation-with-sharing)
4. [Key Workflow Differences](#key-workflow-differences)
5. [Case Sharing Workflow](#case-sharing-workflow)
6. [User Permissions & Access Control](#user-permissions--access-control)
7. [Common Use Cases](#common-use-cases)
8. [Troubleshooting](#troubleshooting)

---

## Overview

ODIS-134 and ODIS-135 introduce collaborative features that fundamentally change how veterinarians work with templates and cases in OdisAI.

### What Changed?

**Before:** Templates and cases were private - only the creator could see and use them.

**After:** Templates and cases can be shared with specific colleagues, enabling team collaboration while maintaining privacy and security.

---

## Before: Template Creation (No Sharing)

### Old Workflow: Private Templates Only

#### Creating a Template

1. **Create Template**
   - User opens Settings → Templates
   - Creates a new SOAP or Discharge template
   - Fills in template fields
   - Saves template

2. **Visibility**
   - ✅ Creator can see and use the template
   - ❌ No one else can see or use the template
   - ❌ No collaboration possible

3. **Access Pattern**

   ```
   User A creates Template → Only User A can use it
   User B wants same template → Must recreate it manually (duplicated effort)
   ```

4. **Limitations**
   - No team templates
   - No standardization across team
   - Duplicated work when multiple vets need same template
   - No way to share best practices

---

## After: Template Creation with Sharing

### New Workflow: Collaborative Templates

#### Creating a Template (Same)

1. **Create Template** (unchanged)
   - User opens Settings → Templates
   - Creates a new SOAP or Discharge template
   - Fills in template fields
   - Saves template

#### Sharing a Template (NEW)

2. **Share Template with Colleagues**
   - User selects template to share
   - Clicks "Share" button (new UI)
   - Selects colleagues from team list
   - Confirms sharing

3. **Visibility After Sharing**
   - ✅ Creator can see and use the template
   - ✅ Shared colleagues can see and use the template
   - ✅ Template appears in their template list automatically
   - ❌ Other team members cannot see it (maintains privacy)

4. **Access Pattern**
   ```
   User A creates Template
   ↓
   User A shares with User B and User C
   ↓
   Users A, B, C can all use the template
   ↓
   User D (not shared with) cannot see it
   ```

#### Managing Shares (NEW)

5. **View Who Has Access**
   - User can see list of colleagues who have access
   - Displays share creation date
   - Shows sharing status

6. **Revoke Access**
   - User can remove specific colleagues from share list
   - Revoked user immediately loses access
   - Template disappears from their list

---

## Key Workflow Differences

### Template Discovery

| Aspect               | Before (ODIS-133)        | After (ODIS-134)                                |
| -------------------- | ------------------------ | ----------------------------------------------- |
| **My Templates**     | Only templates I created | Templates I created + templates shared with me  |
| **Template Count**   | Limited to my own        | Potentially much larger (includes shared)       |
| **Template Source**  | All created by me        | Mix of created + received                       |
| **Visual Indicator** | All look the same        | Shared templates may have indicator (TBD in UI) |

### Template Listing

**Before:**

```swift
// Templates query returned only owned templates
let templates = try await supabase
    .from("soap_templates")
    .select()
    .eq("user_id", currentUserId)
    .execute()
```

**After:**

```swift
// Templates query returns owned + shared (via RLS policies)
let templates = try await supabase
    .from("soap_templates")
    .select()
    .execute()  // RLS automatically includes shared templates!
```

### Template Operations

| Operation       | Before                | After                   | Notes                              |
| --------------- | --------------------- | ----------------------- | ---------------------------------- |
| **Create**      | ✅ Private to creator | ✅ Private to creator   | No change                          |
| **Read/View**   | ✅ Owner only         | ✅ Owner + shared users | Automatic via RLS                  |
| **Update/Edit** | ✅ Owner only         | ✅ Owner only           | Shared users have read-only access |
| **Delete**      | ✅ Owner only         | ✅ Owner only           | Deleting removes all shares        |
| **Share**       | ❌ Not possible       | ✅ Owner only           | New capability                     |
| **Unshare**     | ❌ Not possible       | ✅ Owner only           | New capability                     |

---

## Case Sharing Workflow

### Expected Workflow (ODIS-135)

#### Creating a Case (Same)

1. **Create Case** (unchanged)
   - User creates new appointment/case
   - Records audio
   - Generates SOAP notes
   - Manages patients

#### Sharing a Case (NEW)

2. **Share Case with Colleagues**
   - User selects case to share
   - Clicks "Share" button (new UI)
   - Selects colleagues from team list
   - Confirms sharing

3. **Collaborative Case Management**
   - ✅ Original veterinarian has full access
   - ✅ Shared colleagues can view case details
   - ✅ Shared colleagues can view/edit SOAP notes
   - ✅ Shared colleagues can view recordings/transcriptions
   - ✅ All changes tracked for audit

4. **Use Cases**
   - Shift handoffs (night vet → day vet)
   - Specialty consultations (general vet → specialist)
   - Team care (multiple vets on same patient)
   - Training (experienced vet → trainee)

---

## User Permissions & Access Control

### Template Permissions

| Permission            | Owner  | Shared User | Other Users |
| --------------------- | ------ | ----------- | ----------- |
| View template         | ✅ Yes | ✅ Yes      | ❌ No       |
| Use template in cases | ✅ Yes | ✅ Yes      | ❌ No       |
| Edit template         | ✅ Yes | ❌ No       | ❌ No       |
| Delete template       | ✅ Yes | ❌ No       | ❌ No       |
| Share template        | ✅ Yes | ❌ No       | ❌ No       |
| Unshare template      | ✅ Yes | ❌ No       | ❌ No       |
| View share list       | ✅ Yes | ❌ No       | ❌ No       |

### Case Permissions (Expected)

| Permission      | Owner  | Shared User       | Other Users |
| --------------- | ------ | ----------------- | ----------- |
| View case       | ✅ Yes | ✅ Yes            | ❌ No       |
| Edit SOAP notes | ✅ Yes | ✅ Yes (expected) | ❌ No       |
| View recordings | ✅ Yes | ✅ Yes            | ❌ No       |
| Delete case     | ✅ Yes | ❌ No             | ❌ No       |
| Share case      | ✅ Yes | ❌ No             | ❌ No       |
| Unshare case    | ✅ Yes | ❌ No             | ❌ No       |

### Security Guarantees

- **Privacy by Default:** Templates/cases are private unless explicitly shared
- **Explicit Sharing:** Must explicitly grant access to each user
- **Owner Control:** Only owner can share/unshare
- **Immediate Effect:** Sharing/unsharing takes effect immediately
- **Audit Trail:** All shares tracked with timestamps
- **Data Integrity:** Deleting owner's template/case removes all shares

---

## Common Use Cases

### Use Case 1: Standardizing Team Templates

**Scenario:** Clinic wants all vets to use the same SOAP template for consistency.

**Old Workflow (ODIS-133):**

1. Senior vet creates template
2. Manually shares template content (email, Slack, etc.)
3. Each vet manually recreates template in their account
4. If template changes, repeat steps 2-3
5. No guarantee everyone uses the same version

**New Workflow (ODIS-134):**

1. Senior vet creates template once
2. Shares template with all team vets via OdisAI
3. Everyone immediately has access to same template
4. If template changes, update propagates automatically (same template instance)
5. Guaranteed consistency across team

**Impact:** Saves time, ensures consistency, reduces errors

---

### Use Case 2: Specialty Consultation

**Scenario:** General vet needs specialist to review a complex case.

**Old Workflow (ODIS-133):**

1. General vet creates case and SOAP notes
2. Manually exports or screenshots case info
3. Sends to specialist via email/phone/text
4. Specialist reviews external info (not in OdisAI)
5. Specialist provides feedback via external channel
6. General vet manually updates case in OdisAI

**New Workflow (ODIS-135):**

1. General vet creates case and SOAP notes
2. Shares case with specialist via OdisAI
3. Specialist views complete case in their OdisAI account
4. Specialist adds notes or comments directly in case
5. Both vets see updated case in real-time
6. Complete audit trail of all changes

**Impact:** Faster collaboration, better record keeping, improved patient care

---

### Use Case 3: Shift Handoff

**Scenario:** Night vet needs to hand off ongoing case to day vet.

**Old Workflow (ODIS-133):**

1. Night vet documents case in OdisAI
2. Writes manual handoff notes (paper or separate system)
3. Day vet receives handoff notes
4. Day vet manually searches for or creates case in OdisAI
5. Day vet manually copies handoff info into OdisAI
6. Risk of missed information or duplication

**New Workflow (ODIS-135):**

1. Night vet documents case in OdisAI
2. Shares case with day vet via OdisAI
3. Day vet sees case in their dashboard immediately
4. Day vet continues documenting in same case
5. Complete continuity of care
6. All documentation in one place

**Impact:** Seamless handoffs, reduced errors, improved continuity

---

### Use Case 4: Training New Vets

**Scenario:** Experienced vet training a new vet on proper documentation.

**Old Workflow (ODIS-133):**

1. Experienced vet creates example templates
2. Screenshots or prints examples
3. Shares via email or physically
4. Trainee manually recreates in their account
5. No way to see experienced vet's actual cases
6. Training limited to theoretical examples

**New Workflow (ODIS-134 + ODIS-135):**

1. Experienced vet shares templates with trainee
2. Trainee immediately has access to proven templates
3. Experienced vet shares anonymized cases as examples
4. Trainee sees real-world documentation
5. Trainee can use same templates immediately
6. Training uses actual system and real patterns

**Impact:** Faster onboarding, better learning, standardized practices

---

## Troubleshooting

### Template Sharing Issues

#### Issue: "I shared a template but my colleague can't see it"

**Possible Causes:**

1. Colleague hasn't refreshed their template list
2. Share didn't complete (network issue)
3. Wrong user selected

**Solutions:**

1. Ask colleague to close and reopen templates screen
2. Check share list - is colleague listed?
3. Try sharing again
4. Verify correct user email/ID

---

#### Issue: "I can see a shared template but can't edit it"

**Expected Behavior:** This is correct! Shared users have read-only access.

**Why:** Only the template owner can edit to maintain template integrity.

**Solution:** If you need changes:

1. Contact template owner to request changes
2. Or create your own copy and customize it

---

#### Issue: "Shared template disappeared from my list"

**Possible Causes:**

1. Owner unshared the template
2. Owner deleted the template
3. Network sync issue

**Solutions:**

1. Contact template owner to verify sharing status
2. Refresh template list
3. Check with owner if template was deleted

---

### Case Sharing Issues (Expected)

#### Issue: "I shared a case but colleague can't see it"

**Possible Causes:**

1. Colleague hasn't refreshed their case list
2. Share didn't complete
3. Wrong user selected

**Solutions:**

1. Ask colleague to refresh cases
2. Check share list
3. Try sharing again

---

#### Issue: "Can I share a case with someone outside my clinic?"

**Answer:** This depends on your organization's configuration and security policies. By default, sharing should be limited to users within your organization/clinic.

**Security Note:** Never share patient data with unauthorized users. HIPAA compliance requires proper authorization and audit trails.

---

## Migration Notes for Existing Users

### What Happens to My Existing Templates?

**Good News:** Nothing changes automatically!

- All your existing templates remain private
- They work exactly as before
- You can choose to share them or keep them private
- No action required unless you want to share

### What Happens to My Existing Cases?

**Good News:** Nothing changes automatically!

- All your existing cases remain private
- They work exactly as before
- You can choose to share them or keep them private
- No action required unless you want to share

### Do I Have to Use Sharing?

**No!** Sharing is completely optional.

- You can continue working exactly as before
- All existing workflows still work
- Sharing is an added capability, not a requirement
- Use it only when collaboration is beneficial

---

## Best Practices

### Template Sharing

1. **Start Small:** Share with one trusted colleague first to test workflow
2. **Standardize:** Create clinic-wide templates for common procedures
3. **Document:** Add descriptions to templates explaining their purpose
4. **Review:** Periodically review who has access to your templates
5. **Version Control:** If you need to make major changes, consider creating a new template version

### Case Sharing

1. **Explicit Consent:** Only share cases when necessary for patient care
2. **HIPAA Compliance:** Ensure all shared users are authorized to view patient data
3. **Audit Trail:** Review share history regularly
4. **Timely Unsharing:** Remove access when collaboration is complete
5. **Communication:** Let colleagues know when you've shared a case with them

---

## Summary: What You Need to Know

### For Template Users

✅ **You can now:**

- Share your templates with colleagues
- Use templates shared with you
- See who has access to your templates
- Revoke access anytime

❌ **You cannot:**

- Edit templates shared with you (read-only)
- Share templates you don't own
- Force sharing (owner must explicitly share)

### For Case Users (ODIS-135)

✅ **You can now:**

- Share cases with colleagues for collaboration
- View cases shared with you
- Collaborate on SOAP notes
- See complete case history

❌ **You cannot:**

- Delete cases you don't own
- Share cases you don't own
- Access cases not shared with you

### Key Takeaway

**Sharing is collaborative, secure, and optional.** Use it to improve team workflows while maintaining privacy and control over your data.

---

## Next Steps

1. **Review Documentation:** Read the complete technical docs in this folder
2. **Test Sharing:** Try sharing a template with a trusted colleague
3. **Provide Feedback:** Report any issues or suggestions
4. **Train Team:** Share this document with your team
5. **Establish Policies:** Define clinic policies for sharing templates and cases

---

**Questions or Issues?**

Contact your OdisAI administrator or refer to the technical documentation in:

- `00-OVERVIEW.md` - Feature overview
- `02-SECURITY-CHANGES.md` - Security and permissions
- `03-MIGRATION-GUIDE.md` - Technical migration details
