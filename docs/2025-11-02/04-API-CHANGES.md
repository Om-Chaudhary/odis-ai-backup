# API and Service Layer Changes: ODIS-134 & ODIS-135

**Documentation Date:** November 2, 2025
**Features:** Template Sharing (ODIS-134) & Case Sharing (ODIS-135)

## Table of Contents

- [Overview](#overview)
- [Repository Analysis](#repository-analysis)
- [Expected API Changes](#expected-api-changes)
- [Client Integration](#client-integration)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)

## Overview

This document analyzes the API and service layer changes required to support template and case sharing features. Based on the current codebase state, no changes were detected in the Repository files, suggesting the sharing functionality may be implemented through:

1. **Direct Supabase Client Calls** - UI/ViewModels interact directly with Supabase
2. **Future Service Layer** - Repository changes pending
3. **Separate Sharing Service** - Dedicated service not yet visible in current branch

## Repository Analysis

### Current State: TemplateRepository

**File:** `/Users/s0381806/Development/odis-ai-ios/OdisAI/Repositories/TemplateRepository.swift`

**Current Methods:**

```swift
protocol TemplateRepositoryProtocol {
    func fetchTemplate(id: UUID) async throws -> Template
    func fetchAllTemplates() async throws -> [Template]
    func createTemplate(name: String, type: String, content: String,
                       prompt: String, model: String) async throws -> Template
    func updateTemplate(id: UUID, name: String?, type: String?,
                       content: String?, prompt: String?, model: String?) async throws -> Template
    func deleteTemplate(id: UUID) async throws
}
```

**Observations:**

- ❌ No sharing-specific methods visible
- ✅ Existing methods unchanged (backward compatible)
- ✅ `fetchAllTemplates()` likely returns owned + shared templates via RLS

**How Sharing Works Without Repository Changes:**

The RLS policy on `temp_soap_templates` automatically handles sharing:

```swift
// This query automatically returns owned AND shared templates
let templates: [Template.Response] = try await supabaseClient
    .from("temp_soap_templates")
    .select(templateSelect)
    .execute()
    .value

// RLS policy evaluates:
// WHERE user_id = auth.uid()::text
// OR EXISTS (SELECT 1 FROM soap_template_shares ...)
```

**Result:** Sharing works transparently through database layer, no repository changes needed for read operations.

### Current State: CaseRepository

**File:** `/Users/s0381806/Development/odis-ai-ios/OdisAI/Repositories/CaseRepository.swift`

**Current Methods:**

```swift
protocol CaseRepositoryProtocol {
    func fetchAllCases() async throws -> [Case]
    func fetchCase(id: UUID) async throws -> Case
    func createDraftCase(type: CaseType, visibility: CaseVisibility) async throws -> Case
    func updateCase(id: UUID, type: CaseType?, visibility: CaseVisibility?,
                   status: CaseStatus?) async throws -> Case
    func deleteCase(id: UUID) async throws
    // ... other methods
}
```

**Observations:**

- ❌ No sharing-specific methods visible
- ✅ Existing methods unchanged
- ✅ Session validation added (unrelated to sharing)
- ✅ `fetchAllCases()` likely returns owned + shared cases via RLS

**Session Validation (New):**

```swift
// Added for auth resilience, not sharing-specific
private func validateSessionBeforeOperation() async throws {
    let session = try await supabaseClient.auth.session
    // Validates session is not expired
    // Prevents silent logout issues
}
```

## Expected API Changes

### Sharing Operations API

While not visible in current Repository files, sharing operations require methods for:

#### 1. Creating Shares

**Expected Method Signature:**

```swift
// In TemplateRepository or dedicated SharingService
func shareTemplate(
    templateId: UUID,
    withUserId: UUID
) async throws -> TemplateShare

func shareSoapTemplate(
    templateId: UUID,
    withUserId: UUID
) async throws -> SoapTemplateShare

func shareDischargeTemplate(
    templateId: UUID,
    withUserId: UUID
) async throws -> DischargeTemplateShare

func shareCase(
    caseId: UUID,
    withUserId: UUID
) async throws -> CaseShare
```

**Expected Implementation:**

```swift
func shareTemplate(templateId: UUID, withUserId: UUID) async throws -> TemplateShare {
    let shareData: [[String: Any]] = [
        [
            "template_id": templateId.uuidString,
            "shared_with_user_id": withUserId.uuidString
        ]
    ]

    let jsonData = try JSONSerialization.data(withJSONObject: shareData)
    let jsonString = String(data: jsonData, encoding: .utf8)!

    let shares: [TemplateShare.Response] = try await supabaseClient
        .from("soap_template_shares")
        .insert(jsonString)
        .select("id, template_id, shared_with_user_id, created_at, updated_at")
        .execute()
        .value

    guard let share = shares.first else {
        throw NSError(
            domain: "SharingError",
            code: 500,
            userInfo: [NSLocalizedDescriptionKey: "Failed to create share"]
        )
    }

    return TemplateShare(from: share)
}
```

#### 2. Fetching Shares

**Expected Method Signatures:**

```swift
// Get all users a template is shared with
func fetchTemplateShares(templateId: UUID) async throws -> [TemplateShare]

// Get all templates shared with current user
func fetchSharedTemplates() async throws -> [Template]

// Get all users a case is shared with
func fetchCaseShares(caseId: UUID) async throws -> [CaseShare]

// Get all cases shared with current user
func fetchSharedCases() async throws -> [Case]
```

**Expected Implementation:**

```swift
func fetchTemplateShares(templateId: UUID) async throws -> [TemplateShare] {
    let shares: [TemplateShare.Response] = try await supabaseClient
        .from("soap_template_shares")
        .select("id, template_id, shared_with_user_id, created_at, updated_at")
        .eq("template_id", value: templateId.uuidString)
        .execute()
        .value

    return shares.map { TemplateShare(from: $0) }
}

func fetchSharedTemplates() async throws -> [Template] {
    // Option 1: Query shares first, then templates
    let shares: [TemplateShare.Response] = try await supabaseClient
        .from("soap_template_shares")
        .select("template_id")
        .eq("shared_with_user_id", value: currentUserId)
        .execute()
        .value

    let templateIds = shares.map { $0.templateId }

    // Fetch templates by IDs
    // ...

    // Option 2: Let RLS handle it (preferred)
    // fetchAllTemplates() already returns shared templates via RLS
    return try await fetchAllTemplates()
}
```

#### 3. Revoking Shares

**Expected Method Signatures:**

```swift
// Revoke specific share
func revokeTemplateShare(templateId: UUID, fromUserId: UUID) async throws

// Revoke all shares for a template
func revokeAllTemplateShares(templateId: UUID) async throws

// Revoke specific case share
func revokeCaseShare(caseId: UUID, fromUserId: UUID) async throws
```

**Expected Implementation:**

```swift
func revokeTemplateShare(templateId: UUID, fromUserId: UUID) async throws {
    try await supabaseClient
        .from("soap_template_shares")
        .delete()
        .eq("template_id", value: templateId.uuidString)
        .eq("shared_with_user_id", value: fromUserId.uuidString)
        .execute()
}

func revokeAllTemplateShares(templateId: UUID) async throws {
    try await supabaseClient
        .from("soap_template_shares")
        .delete()
        .eq("template_id", value: templateId.uuidString)
        .execute()
}
```

### Data Models

**Expected New Models:**

```swift
// MARK: - Template Share Models

struct TemplateShare: Identifiable, Codable {
    let id: UUID
    let templateId: UUID
    let sharedWithUserId: UUID
    let createdAt: Date
    let updatedAt: Date

    struct Response: Decodable {
        let id: String
        let template_id: String
        let shared_with_user_id: String
        let created_at: String
        let updated_at: String
    }

    init(from response: Response) {
        self.id = UUID(uuidString: response.id) ?? UUID()
        self.templateId = UUID(uuidString: response.template_id) ?? UUID()
        self.sharedWithUserId = UUID(uuidString: response.shared_with_user_id) ?? UUID()
        self.createdAt = SupabaseDateUtils.stringToDate(response.created_at)
        self.updatedAt = SupabaseDateUtils.stringToDate(response.updated_at)
    }
}

// MARK: - Case Share Models

struct CaseShare: Identifiable, Codable {
    let id: UUID
    let caseId: UUID
    let sharedWithUserId: UUID
    let createdAt: Date
    let updatedAt: Date

    struct Response: Decodable {
        let id: String
        let case_id: String
        let shared_with_user_id: String
        let created_at: String
        let updated_at: String
    }

    init(from response: Response) {
        self.id = UUID(uuidString: response.id) ?? UUID()
        self.caseId = UUID(uuidString: response.case_id) ?? UUID()
        self.sharedWithUserId = UUID(uuidString: response.shared_with_user_id) ?? UUID()
        self.createdAt = SupabaseDateUtils.stringToDate(response.created_at)
        self.updatedAt = SupabaseDateUtils.stringToDate(response.updated_at)
    }
}
```

### User Lookup API

For sharing UI, need to fetch users to share with:

**Expected Service:**

```swift
class UserService {
    let supabaseClient: SupabaseClient

    func searchUsers(query: String) async throws -> [User] {
        // Search users by email or name
        // Implementation depends on available user profile data
    }

    func fetchClinicUsers() async throws -> [User] {
        // Fetch users in same clinic/organization
        // Requires clinic/org relationship in database
    }
}
```

**Expected User Model:**

```swift
struct User: Identifiable, Codable {
    let id: UUID
    let email: String
    let name: String?
    let avatar: String?

    struct Response: Decodable {
        let id: String
        let email: String
        let name: String?
        let avatar: String?
    }
}
```

## Client Integration

### ViewModel Integration

**Example: Template Sharing ViewModel**

```swift
class TemplateDetailViewModel: ObservableObject {
    @Published var template: Template
    @Published var shares: [TemplateShare] = []
    @Published var isLoadingShares = false
    @Published var shareError: Error?

    private let templateRepository: TemplateRepositoryProtocol
    private let sharingService: SharingServiceProtocol

    init(template: Template,
         templateRepository: TemplateRepositoryProtocol,
         sharingService: SharingServiceProtocol) {
        self.template = template
        self.templateRepository = templateRepository
        self.sharingService = sharingService
    }

    func loadShares() async {
        isLoadingShares = true
        defer { isLoadingShares = false }

        do {
            shares = try await sharingService.fetchTemplateShares(
                templateId: template.id
            )
        } catch {
            shareError = error
        }
    }

    func shareTemplate(withUserId: UUID) async throws {
        let share = try await sharingService.shareTemplate(
            templateId: template.id,
            withUserId: withUserId
        )

        // Update local state
        await MainActor.run {
            shares.append(share)
        }

        // Track analytics
        AnalyticsService.shared.track(event: "template_shared", properties: [
            "template_id": template.id.uuidString,
            "shared_with_user_id": withUserId.uuidString
        ])
    }

    func revokeShare(userId: UUID) async throws {
        try await sharingService.revokeTemplateShare(
            templateId: template.id,
            fromUserId: userId
        )

        // Update local state
        await MainActor.run {
            shares.removeAll { $0.sharedWithUserId == userId }
        }

        // Track analytics
        AnalyticsService.shared.track(event: "template_share_revoked", properties: [
            "template_id": template.id.uuidString,
            "revoked_from_user_id": userId.uuidString
        ])
    }
}
```

### SwiftUI View Integration

**Example: Template Sharing View**

```swift
struct TemplateSharingView: View {
    @StateObject var viewModel: TemplateDetailViewModel
    @State private var showingUserPicker = false

    var body: some View {
        List {
            Section("Shared With") {
                if viewModel.shares.isEmpty {
                    Text("Not shared with anyone")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(viewModel.shares) { share in
                        ShareRow(share: share) {
                            Task {
                                try? await viewModel.revokeShare(
                                    userId: share.sharedWithUserId
                                )
                            }
                        }
                    }
                }
            }

            Section {
                Button("Share Template") {
                    showingUserPicker = true
                }
            }
        }
        .navigationTitle("Sharing")
        .sheet(isPresented: $showingUserPicker) {
            UserPickerView { selectedUser in
                Task {
                    try? await viewModel.shareTemplate(
                        withUserId: selectedUser.id
                    )
                }
            }
        }
        .task {
            await viewModel.loadShares()
        }
    }
}

struct ShareRow: View {
    let share: TemplateShare
    let onRevoke: () -> Void

    // Fetch user details for display
    @State private var user: User?

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(user?.email ?? "Loading...")
                    .font(.body)
                Text("Shared \(share.createdAt.timeAgoDisplay)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: onRevoke) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.red)
            }
        }
    }
}
```

## Error Handling

### Expected Errors

**1. Duplicate Share Error:**

```swift
enum SharingError: LocalizedError {
    case duplicateShare
    case templateNotFound
    case userNotFound
    case permissionDenied
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .duplicateShare:
            return "This template is already shared with that user"
        case .templateNotFound:
            return "Template not found"
        case .userNotFound:
            return "User not found"
        case .permissionDenied:
            return "You don't have permission to share this template"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}
```

**2. Error Handling in Repository:**

```swift
func shareTemplate(templateId: UUID, withUserId: UUID) async throws -> TemplateShare {
    do {
        // Attempt to create share
        let shares: [TemplateShare.Response] = try await supabaseClient
            .from("soap_template_shares")
            .insert(shareData)
            .select()
            .execute()
            .value

        guard let share = shares.first else {
            throw SharingError.templateNotFound
        }

        return TemplateShare(from: share)

    } catch {
        // Parse Supabase error
        if let nsError = error as NSError?,
           nsError.domain.contains("unique constraint") {
            throw SharingError.duplicateShare
        }

        if let nsError = error as NSError?,
           nsError.code == 403 {
            throw SharingError.permissionDenied
        }

        throw SharingError.networkError(error)
    }
}
```

**3. UI Error Handling:**

```swift
struct TemplateDetailView: View {
    @StateObject var viewModel: TemplateDetailViewModel
    @State private var showingError = false
    @State private var errorMessage = ""

    var body: some View {
        // ... view content
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .onChange(of: viewModel.shareError) { error in
            if let error = error {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}
```

## Performance Considerations

### Query Optimization

**1. Fetching Templates with Share Count:**

```swift
// Instead of N+1 queries, use aggregation
let templatesWithShareCount: [TemplateWithShareCount] = try await supabaseClient
    .from("temp_soap_templates")
    .select("""
        id, name, content,
        share_count:soap_template_shares(count)
    """)
    .execute()
    .value
```

**2. Batch Share Operations:**

```swift
func shareWithMultipleUsers(
    templateId: UUID,
    userIds: [UUID]
) async throws -> [TemplateShare] {
    // Create all shares in single request
    let shareData = userIds.map { userId in
        [
            "template_id": templateId.uuidString,
            "shared_with_user_id": userId.uuidString
        ]
    }

    let jsonData = try JSONSerialization.data(withJSONObject: shareData)
    let jsonString = String(data: jsonData, encoding: .utf8)!

    let shares: [TemplateShare.Response] = try await supabaseClient
        .from("soap_template_shares")
        .insert(jsonString)
        .select()
        .execute()
        .value

    return shares.map { TemplateShare(from: $0) }
}
```

**3. Caching Shared Templates:**

```swift
class TemplateRepository: ObservableObject {
    private var sharedTemplatesCache: [Template]?
    private var cacheTimestamp: Date?
    private let cacheValidityDuration: TimeInterval = 300 // 5 minutes

    func fetchSharedTemplates() async throws -> [Template] {
        // Return cached if still valid
        if let cached = sharedTemplatesCache,
           let timestamp = cacheTimestamp,
           Date().timeIntervalSince(timestamp) < cacheValidityDuration {
            return cached
        }

        // Fetch fresh data
        let templates = try await fetchAllTemplates()
        let shared = templates.filter { !isOwnedByCurrentUser($0) }

        // Update cache
        sharedTemplatesCache = shared
        cacheTimestamp = Date()

        return shared
    }

    func invalidateSharedTemplatesCache() {
        sharedTemplatesCache = nil
        cacheTimestamp = nil
    }
}
```

### Pagination

**For large share lists:**

```swift
func fetchTemplateShares(
    templateId: UUID,
    page: Int = 0,
    pageSize: Int = 20
) async throws -> (shares: [TemplateShare], hasMore: Bool) {
    let offset = page * pageSize

    let shares: [TemplateShare.Response] = try await supabaseClient
        .from("soap_template_shares")
        .select()
        .eq("template_id", value: templateId.uuidString)
        .range(from: offset, to: offset + pageSize)
        .execute()
        .value

    let hasMore = shares.count == pageSize + 1
    let finalShares = hasMore ? Array(shares.dropLast()) : shares

    return (
        shares: finalShares.map { TemplateShare(from: $0) },
        hasMore: hasMore
    )
}
```

## Summary

### Current State

- ✅ No breaking changes to existing Repository methods
- ✅ RLS handles read access transparently
- ✅ Session validation added (unrelated to sharing)
- ❌ No sharing-specific methods visible in current codebase

### Expected Implementation

The sharing features likely work through:

1. **Database RLS Policies** - Handle read access automatically
2. **Direct Supabase Calls** - ViewModels may call Supabase directly for share CRUD
3. **Future Service Layer** - Dedicated sharing service to be added

### Recommended API Design

- Dedicated `SharingService` for share operations
- Keep Repository methods focused on core resources
- Use ViewModels to orchestrate sharing UI logic
- Implement proper error handling for RLS policy violations
- Add caching for frequently accessed shared resources
- Use pagination for large share lists

### Integration Points

1. **TemplateRepository** - Already returns shared templates via RLS
2. **CaseRepository** - Already returns shared cases via RLS (expected)
3. **SharingService** - New service for share CRUD operations (expected)
4. **UserService** - User lookup for sharing UI (expected)
5. **AnalyticsService** - Track sharing events (recommended)

### Performance Best Practices

- ✅ Use indexes on foreign keys (already in migration)
- ✅ Leverage RLS for query filtering
- ✅ Batch share operations when possible
- ✅ Cache shared resource lists
- ✅ Paginate large share lists
- ✅ Minimize N+1 query patterns
