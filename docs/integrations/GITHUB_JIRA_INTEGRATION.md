# GitHub-Jira Automation Integration Documentation

> **Document Purpose**: Complete guide for automated Kanban board updates based on GitHub pull request activities
>
> **Date**: 2024-11-29
> **Status**: Active Integration
> **Maintained By**: Engineering Team

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Configuration Details](#configuration-details)
4. [Connected Repositories](#connected-repositories)
5. [Webhook Configuration](#webhook-configuration)
6. [Kanban Board Structure](#kanban-board-structure)
7. [How It Works](#how-it-works)
8. [Linking PRs to Jira Issues](#linking-prs-to-jira-issues)
9. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
10. [Security Considerations](#security-considerations)
11. [Future Enhancements](#future-enhancements)
12. [Developer Quick Reference](#developer-quick-reference)

---

## Overview

### Purpose

This integration automatically updates the **OdisAI Engineering** Jira Kanban board based on pull request activities in GitHub repositories. When developers create, update, or merge pull requests, the corresponding Jira issues automatically transition between board columns (TO DO → IN PROGRESS → IN REVIEW → DONE).

### Key Features

- **Automatic Board Updates**: No manual Jira board management required
- **Real-Time Synchronization**: PR events trigger immediate board transitions
- **Multi-Repository Support**: 5 repositories connected to single Jira workspace
- **Epic Mapping**: Each repository mapped to its corresponding Jira epic
- **Event Coverage**: Supports all PR event types (opened, closed, merged, etc.)

### Integration Type

```
GitHub Webhooks → Jira Automation Rules
```

When pull request events occur in GitHub, webhooks trigger Jira automation rules that transition issues on the Kanban board.

---

## System Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              GitHub Repository (Odis-AI org)                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ odis-ai-web   │  │ odis-ai-ios  │  │ odis-ai-     │     │
│  │               │  │              │  │ extension    │     │
│  └──────┬────────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                   │                  │            │
│         └───────────────────┼──────────────────┘            │
│                             │                                │
│                    PR Event (opened/closed/merged)          │
└─────────────────────────────┼────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  GitHub Webhook      │
                    │  (POST Request)      │
                    └──────────┬───────────┘
                               │
                               │ HTTPS
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │  Jira Incoming Webhook Endpoint              │
        │  https://api-private.atlassian.com/          │
        │  automation/webhooks/jira/a/6ab0ci            │
        └──────────────────┬───────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────────────┐
        │  Jira Automation Rule                        │
        │  Name: GitHub PR to Jira Kanban Automation   │
        │  ID: 019ad290-4704-728f-8436-5a8d65cea258     │
        │  Status: ENABLED                              │
        └──────────────────┬───────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────────────┐
        │  Action: Transition Work Item                │
        │  (Moves issue between Kanban columns)        │
        └──────────────────┬───────────────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────────────┐
        │  OdisAI Engineering Kanban Board             │
        │  odisai.atlassian.net                         │
        │                                               │
        │  TO DO → IN PROGRESS → IN REVIEW → DONE      │
        └──────────────────────────────────────────────┘
```

### Data Flow

**Phase 1: PR Event**

```
Developer creates/updates PR in GitHub
    ↓
GitHub detects PR event (opened, closed, merged, etc.)
    ↓
GitHub webhook triggers HTTP POST to Jira
```

**Phase 2: Jira Processing**

```
Jira receives webhook payload
    ↓
Automation rule parses PR data
    ↓
Rule identifies linked Jira issue (from branch name or PR description)
    ↓
Rule executes transition action
    ↓
Issue moves on Kanban board
```

---

## Configuration Details

### Jira Automation Rule

**Rule Name**: GitHub PR to Jira Kanban Automation

**Rule ID**: `019ad290-4704-728f-8436-5a8d65cea258`

**Status**: ✅ ENABLED

**Jira Workspace**:

- **Domain**: `odisai.atlassian.net`
- **Project**: OdisAI Engineering (ODIS)
- **Board Type**: Kanban

**Direct Rule Link**:

```
https://odisai.atlassian.net/jira/software/projects/ODIS/settings/automation#/rule/019ad290-4704-728f-8436-5a8d65cea258
```

### Webhook Endpoint

**URL**: `https://api-private.atlassian.com/automation/webhooks/jira/a/6ab0ci`

**Components**:

- **Trigger**: Incoming webhook (receives HTTP POST from GitHub)
- **Action**: Transition work item (moves issues between Kanban columns)

---

## Connected Repositories

### Active Integrations (5 repositories)

All repositories below have webhooks configured to send pull request events to Jira:

| Repository          | Type     | Language   | Epic Mapping     |
| ------------------- | -------- | ---------- | ---------------- |
| `odis-ai-ios`       | Internal | Swift      | ✓ Mobile Epic    |
| `odis-ai-web`       | Internal | TypeScript | ✓ Web Epic       |
| `odis-ai-extension` | Internal | TypeScript | ✓ Extension Epic |
| `odis-ai-desktop`   | Internal | TypeScript | ✓ Desktop Epic   |
| `odis-ai-backend`   | Internal | TypeScript | ✓ Backend Epic   |

### Excluded Repositories

- **`odis-ai`** - Not mapped to a Jira epic
- **`reign-buddy`** - Private project, not part of OdisAI Engineering workflow

---

## Webhook Configuration

### GitHub Webhook Settings

Each repository webhook is configured identically:

**Configuration**:

```yaml
Payload URL: https://api-private.atlassian.com/automation/webhooks/jira/a/6ab0ci
Content Type: application/json
Secret: (managed by Jira)
SSL Verification: Enabled
Active: Yes
```

**Where to Configure**:

```
https://github.com/Odis-AI/{repository}/settings/hooks
```

### Triggered Events

**Pull Requests**: All PR events trigger the webhook, including:

| Event                                        | Description                            | Typical Board Action                              |
| -------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| `opened`                                     | New PR created                         | Move issue to "IN PROGRESS"                       |
| `closed`                                     | PR closed or merged                    | Move to "DONE" (if merged) or "TO DO" (if closed) |
| `reopened`                                   | Closed PR reopened                     | Move back to "IN PROGRESS"                        |
| `edited`                                     | PR title, body, or base branch changes | No transition (status update only)                |
| `assigned` / `unassigned`                    | Reviewers change                       | No transition                                     |
| `labeled` / `unlabeled`                      | Labels modified                        | No transition                                     |
| `review_requested`                           | Review requested                       | Move to "IN REVIEW"                               |
| `review_request_removed`                     | Review request cancelled               | Move back to "IN PROGRESS"                        |
| `ready_for_review`                           | Draft PR marked ready                  | Move to "IN REVIEW"                               |
| `converted_to_draft`                         | PR converted to draft                  | Move back to "IN PROGRESS"                        |
| `synchronized`                               | New commits pushed                     | No transition                                     |
| `auto_merge_enabled` / `auto_merge_disabled` | Auto-merge status changes              | No transition                                     |
| `locked` / `unlocked`                        | Conversation locked                    | No transition                                     |
| `enqueued` / `dequeued`                      | Merge queue changes                    | No transition                                     |
| `milestoned` / `demilestoned`                | Milestone changes                      | No transition                                     |

---

## Kanban Board Structure

### Board Columns

```
TO DO → IN PROGRESS → IN REVIEW → DONE
```

### Automation Workflow Examples

The Jira automation rule can be configured to move issues based on PR state:

| PR Event               | Board Transition            |
| ---------------------- | --------------------------- |
| PR opened              | Move issue to "IN PROGRESS" |
| PR ready_for_review    | Move issue to "IN REVIEW"   |
| PR merged              | Move issue to "DONE"        |
| PR closed (not merged) | Move issue back to "TO DO"  |

**Note**: The current rule has a basic "Transition work item" action. You may need to configure specific transitions based on PR events using conditional logic in Jira.

---

## How It Works

### Example Scenario

1. **Developer creates a PR** in `odis-ai-web` repo
   - Branch: `feature/ODIS-123-add-user-authentication`
   - PR title: `[ODIS-123] Add user authentication feature`

2. **GitHub sends webhook** with PR details

   ```json
   {
     "action": "opened",
     "pull_request": {
       "title": "[ODIS-123] Add user authentication feature",
       "head": {
         "ref": "feature/ODIS-123-add-user-authentication"
       }
     }
   }
   ```

3. **Jira receives the webhook** and parses the JSON payload

4. **Automation rule identifies** the linked Jira issue:
   - Extracts issue key `ODIS-123` from branch name or PR title
   - Finds issue in Jira project

5. **Rule executes transition** moving issue from "TO DO" to "IN PROGRESS"

6. **Team sees updated board** reflecting current PR status

### Payload Structure

#### Sample GitHub Webhook Payload

When a PR is opened, GitHub sends:

```json
{
  "action": "opened",
  "number": 42,
  "pull_request": {
    "id": 123456789,
    "title": "[ODIS-45] Implement dashboard",
    "state": "open",
    "user": {
      "login": "developer-username"
    },
    "head": {
      "ref": "feature/ODIS-45-implement-dashboard"
    },
    "base": {
      "ref": "main"
    },
    "draft": false,
    "merged": false,
    "html_url": "https://github.com/Odis-AI/odis-ai-web/pull/42"
  },
  "repository": {
    "name": "odis-ai-web",
    "full_name": "Odis-AI/odis-ai-web"
  }
}
```

### Jira Can Access

From the webhook payload, Jira automation can extract:

- `{{webhookData.action}}` - The PR event type
- `{{webhookData.pull_request.title}}` - PR title
- `{{webhookData.pull_request.state}}` - open/closed
- `{{webhookData.pull_request.merged}}` - true/false
- `{{webhookData.pull_request.draft}}` - true/false
- `{{webhookData.repository.name}}` - Repository name
- `{{webhookData.pull_request.head.ref}}` - Branch name

---

## Linking PRs to Jira Issues

### Best Practices

To ensure PRs are properly linked to Jira issues, use one of these methods:

### Method 1: Branch Naming Convention

**Format**: `{type}/ODIS-{issue-number}-{description}`

**Examples**:

```bash
# Feature branch
git checkout -b feature/ODIS-123-add-user-authentication

# Bug fix branch
git checkout -b bugfix/ODIS-89-fix-login-error

# Hotfix branch
git checkout -b hotfix/ODIS-120-patch-security-issue
```

**Supported Types**:

- `feature/` - New features
- `bugfix/` or `fix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks

### Method 2: PR Title or Description

Include the Jira issue key in the PR title or description:

**PR Title Format**:

```markdown
[ODIS-123] Add user authentication feature
```

**PR Description Format**:

```markdown
## Description

This PR implements user authentication.

## Jira Issue

ODIS-123

## Changes

- Added login form
- Implemented JWT tokens
- Added password reset flow

Closes: ODIS-123
```

### Method 3: Commit Messages

Include the issue key in commit messages:

```bash
git commit -m "ODIS-123: Add user authentication"
git commit -m "fix(ODIS-89): Resolve login error"
```

**Conventional Commits Format**:

```bash
git commit -m "feat(ODIS-123): add user authentication"
git commit -m "fix(ODIS-89): resolve login error"
```

### Issue Key Format

Jira issue keys follow this pattern:

```
ODIS-{number}
```

Where:

- `ODIS` = Project key (OdisAI Engineering)
- `{number}` = Sequential issue number (e.g., 123, 456, 789)

---

## Monitoring and Troubleshooting

### Checking Webhook Delivery

#### GitHub Side

1. Navigate to repository → **Settings** → **Webhooks**
2. Click on the webhook URL
3. View **"Recent Deliveries"** tab
4. Check response codes:
   - `200` = Success
   - `4xx` = Client error (check payload format)
   - `5xx` = Server error (check Jira automation rule)

**Example Delivery Log**:

```
✅ 200 OK - 2 minutes ago
✅ 200 OK - 15 minutes ago
❌ 500 Internal Server Error - 1 hour ago
```

#### Jira Side

1. Go to **OdisAI Engineering** → **Settings** → **Automation**
2. Click on **"GitHub PR to Jira Kanban Automation"**
3. Click **"Audit log"** to see execution history
4. Check for:
   - Successful webhook receipts
   - Rule executions
   - Transition actions performed

**Example Audit Log**:

```
✅ Webhook received - PR opened (ODIS-123)
✅ Rule executed - Transitioned issue to "IN PROGRESS"
✅ Webhook received - PR merged (ODIS-123)
✅ Rule executed - Transitioned issue to "DONE"
```

### Common Issues

#### Issue: Webhook shows as delivered but Jira doesn't transition the issue

**Symptoms**:

- GitHub webhook shows `200 OK` response
- Jira audit log shows webhook received
- Issue remains in original column

**Possible Causes**:

1. Issue key not found in PR branch, title, or description
2. Issue key format incorrect (e.g., `ODIS123` instead of `ODIS-123`)
3. Issue belongs to different Jira project
4. Automation rule condition not met

**Solutions**:

1. Verify issue key is in PR:
   - Check branch name: `feature/ODIS-123-description`
   - Check PR title: `[ODIS-123] Description`
   - Check PR description: `Closes ODIS-123`
2. Verify issue exists in Jira:
   - Search for issue: `ODIS-123`
   - Confirm it's in the OdisAI Engineering project
3. Check automation rule conditions:
   - Verify rule is enabled
   - Review rule trigger conditions

#### Issue: Webhook delivery fails (non-200 response)

**Symptoms**:

- GitHub webhook shows `4xx` or `5xx` response
- Error message in delivery log

**Possible Causes**:

1. Network issue between GitHub and Jira
2. Jira automation rule is disabled
3. Webhook endpoint URL changed
4. Invalid payload format

**Solutions**:

1. Verify rule is enabled in Jira automation settings
2. Check webhook URL is correct:
   ```
   https://api-private.atlassian.com/automation/webhooks/jira/a/6ab0ci
   ```
3. Review recent deliveries for error details
4. Check Jira status page for service outages

#### Issue: Wrong issue gets transitioned

**Symptoms**:

- Multiple issue keys in PR (e.g., "ODIS-45" and "ODIS-67")
- Wrong issue moves on board

**Possible Causes**:

1. Multiple issue keys in branch name or PR description
2. Automation rule matches first issue key found
3. Ambiguous issue key format

**Solutions**:

1. Use only one issue key per PR
2. Configure Jira rule to handle multiple issues (if needed)
3. Use clear issue key format: `ODIS-{number}`

#### Issue: Issue transitions to wrong column

**Symptoms**:

- PR opened but issue stays in "TO DO"
- PR merged but issue doesn't move to "DONE"

**Possible Causes**:

1. Automation rule conditions not configured correctly
2. Issue already in target column
3. Transition path not available (e.g., can't go from "DONE" to "IN PROGRESS")

**Solutions**:

1. Review automation rule configuration
2. Check available transitions for issue type
3. Verify issue workflow allows the transition

---

## Security Considerations

### Webhook Security

**SSL/TLS**: All webhook communications use HTTPS

**Secret**: Jira provides a secret for webhook validation (auto-managed)

**Private Endpoints**: The Jira webhook URL is specific to your workspace

**Access Control**: Only GitHub repos with configured webhooks can trigger rules

### Permissions Required

**GitHub**:

- Repository admin access (to configure webhooks)

**Jira**:

- Project admin or automation admin (to create/modify rules)

### Best Practices

1. **Never commit webhook secrets** to version control
2. **Use HTTPS only** for webhook endpoints
3. **Verify webhook signatures** (handled automatically by Jira)
4. **Limit webhook access** to trusted repositories only
5. **Monitor webhook deliveries** for suspicious activity

---

## Future Enhancements

### Potential Improvements

#### 1. Conditional Transitions

Add "IF/THEN" conditions in Jira rule:

**Example**:

```
IF PR merged → Move to DONE
IF PR closed (not merged) → Move to TO DO
IF PR draft → Move to IN PROGRESS
IF PR ready_for_review → Move to IN REVIEW
```

#### 2. Smart Issue Detection

Configure JQL query in Jira to find issues by branch name:

**Example**:

```jql
project = ODIS AND key IN (
  SELECT issue FROM branch WHERE name ~ "ODIS-\d+"
)
```

Add regex patterns for different branch naming conventions.

#### 3. Status Mapping

Map PR states to Jira statuses:

| PR State            | Jira Status    |
| ------------------- | -------------- |
| Draft               | IN PROGRESS    |
| Ready for Review    | IN REVIEW      |
| Approved            | READY TO MERGE |
| Merged              | DONE           |
| Closed (not merged) | TO DO          |

#### 4. Notifications

Add Slack/email notifications when issues transition:

- Notify assignee when PR is ready for review
- Notify team when PR is merged
- Alert on failed webhook deliveries

#### 5. Multi-Repository Logic

Create repository-specific rules for different workflows:

**Example**:

```javascript
if (repository.name === "odis-ai-web") {
  // Web-specific workflow
} else if (repository.name === "odis-ai-ios") {
  // iOS-specific workflow
}
```

Add conditions based on `{{webhookData.repository.name}}`.

#### 6. PR Status Badge

Display Jira issue status in PR description:

```markdown
## Jira Status

![Jira](https://odisai.atlassian.net/rest/api/2/issue/ODIS-123/status)
```

#### 7. Automatic Issue Creation

Create Jira issues automatically when PRs are opened (if no issue key found):

- Extract issue title from PR title
- Assign to PR author
- Link to PR

---

## Developer Quick Reference

### When Creating a New Repository

If you create a new repository that should integrate with Jira:

1. **Navigate to repository settings**:

   ```
   https://github.com/Odis-AI/{new-repo}/settings/hooks
   ```

2. **Click "Add webhook"**

3. **Configure webhook**:
   - **Payload URL**: `https://api-private.atlassian.com/automation/webhooks/jira/a/6ab0ci`
   - **Content type**: `application/json`
   - **Events**: Select "Pull requests"
   - **Active**: ✓

4. **Save**: Click "Add webhook"

5. **Test**: Create a test PR with issue key to verify integration

### When Creating a PR

Use this format:

**Branch name**:

```bash
feature/ODIS-{issue-number}-{brief-description}
```

**PR title**:

```markdown
[ODIS-{issue-number}] Brief description of changes
```

**First line of PR description**:

```markdown
Resolves ODIS-{issue-number}
```

**Example**:

```bash
# Branch
feature/ODIS-123-add-user-authentication

# PR Title
[ODIS-123] Add user authentication feature

# PR Description
Resolves ODIS-123

This PR implements user authentication with JWT tokens...
```

### When Reviewing Code

The Kanban board will automatically update as PRs progress, so:

- ✅ Check the **"IN REVIEW"** column for PRs awaiting review
- ✅ Issues will move to **"DONE"** automatically when PRs are merged
- ✅ No manual board updates needed!

### Branch Naming Cheat Sheet

```bash
# Features
feature/ODIS-123-add-feature-name

# Bug fixes
bugfix/ODIS-456-fix-bug-description
fix/ODIS-456-fix-bug-description

# Hotfixes
hotfix/ODIS-789-critical-fix

# Chores
chore/ODIS-101-update-dependencies
```

### Issue Key Extraction Rules

Jira automation extracts issue keys using these patterns:

1. **Branch name**: `ODIS-{number}` (e.g., `feature/ODIS-123-name`)
2. **PR title**: `[ODIS-{number}]` (e.g., `[ODIS-123] Title`)
3. **PR description**: `ODIS-{number}` or `Closes ODIS-{number}`

**Priority**: Branch name > PR title > PR description

---

## Configuration Files

### Where to Find Settings

**GitHub Webhooks**:

```
https://github.com/Odis-AI/{repository}/settings/hooks
```

**Jira Automation Rule**:

```
https://odisai.atlassian.net/jira/software/projects/ODIS/settings/automation
```

**Direct Rule Link**:

```
https://odisai.atlassian.net/jira/software/projects/ODIS/settings/automation#/rule/019ad290-4704-728f-8436-5a8d65cea258
```

---

## Contact and Support

**Jira Workspace**: `odisai.atlassian.net`

**GitHub Organization**: `github.com/Odis-AI`

**Automation Rule Owner**: `admin@odisai.net`

### For Issues

| Problem                     | Solution                                           |
| --------------------------- | -------------------------------------------------- |
| Jira automation not working | Check Jira automation audit logs                   |
| Webhook delivery failures   | Check GitHub webhook recent deliveries             |
| Board not updating          | Verify issue key is in PR branch/title/description |
| Wrong issue transitions     | Check automation rule conditions                   |
| Multiple issues in PR       | Use only one issue key per PR                      |

---

## Revision History

| Date       | Version | Changes                                  |
| ---------- | ------- | ---------------------------------------- |
| 2024-11-29 | 1.0     | Initial setup - 5 repositories connected |

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-29  
**Maintained By**: Engineering Team  
**Questions?**: Contact automation rule owner or see Jira automation documentation
