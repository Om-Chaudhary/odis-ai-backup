# API Authentication & Authorization System

Clean, reusable authentication for Next.js API routes with **automatic detection** of cookies or Bearer tokens.

## Overview

This system provides type-safe utilities for:

- ✅ **Auto-detection** - Automatically handles both cookie and Bearer token auth
- ✅ **Authorization** - Role-based access control with hierarchy
- ✅ **Error Handling** - Consistent error responses
- ✅ **Type Safety** - Full TypeScript support
- ✅ **DRY Principle** - No duplicated auth code

## Quick Start

### 1. Simple Authenticated Route

```typescript
// src/app/api/profile/route.ts
import { withAuth, successResponse } from "~/lib/api/auth";

export const GET = withAuth(async (request, { user, supabase }) => {
  // Works for both web app (cookies) and extension (Bearer token)
  // No configuration needed!

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return successResponse({ profile: data });
});
```

### 2. Admin-Only Route

```typescript
// src/app/api/admin/users/route.ts
import { withAuth, successResponse } from "~/lib/api/auth";

export const GET = withAuth(
  async (request, { supabase }) => {
    const { data } = await supabase.from("users").select("*");
    return successResponse({ users: data });
  },
  { requireRole: "admin" }, // 👈 Only admins can access
);
```

## How It Works

The system **automatically detects** the authentication method:

```typescript
// Web app request (cookies) ✅
fetch("/api/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data: "..." }),
});

// Browser extension request (Bearer token) ✅
fetch("https://yourapp.com/api/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userToken}`,
  },
  body: JSON.stringify({ data: "..." }),
});
```

**Same API route handles both!** No flags or configuration needed.

## Files

- [`auth.ts`](./auth.ts) - Main authentication utilities
- [`USAGE_EXAMPLES.md`](./USAGE_EXAMPLES.md) - Comprehensive usage guide
- [`README.md`](./README.md) - This file
- [`ORCHESTRATION_API_GUIDE.md`](./ORCHESTRATION_API_GUIDE.md) - Complete orchestration API guide for data verification

## API Reference

### `withAuth(handler, options?)`

Higher-order function for authenticated routes.

**Parameters:**

- `handler` - Your route handler receiving `(request, { user, supabase }, context)`
- `options` - Optional configuration:
  - `requireRole?: 'admin' | 'user' | 'guest'` - Required role (default: any authenticated)
  - `messages?: { unauthorized?, forbidden? }` - Custom error messages

**Returns:** Wrapped route handler with automatic auth + error handling

**Example:**

```typescript
export const POST = withAuth(
  async (request, { user, supabase }) => {
    // Your logic here
  },
  { requireRole: "admin" },
);
```

---

### `authenticateUser(request, options?)`

Manual authentication for complex cases.

**Parameters:**

- `request: NextRequest` - The incoming request
- `options: AuthOptions` - Same as withAuth options

**Returns:**

```typescript
Promise<
  | { success: true; data: { user: User; supabase: SupabaseClient } }
  | { success: false; response: NextResponse }
>;
```

**Example:**

```typescript
export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth.success) return auth.response;

  const { user, supabase } = auth.data;
  // Custom logic...
}
```

---

### `successResponse(data, status?)`

Create standardized success response.

**Example:**

```typescript
return successResponse({ id: 123 }, 201);
// { "id": 123 } with 201 status
```

---

### `errorResponse(error, status?, details?)`

Create standardized error response.

**Example:**

```typescript
return errorResponse("Not found", 404);
// { "error": "Not found" } with 404 status

return errorResponse("Validation failed", 400, {
  errors: [{ field: "email", message: "Invalid" }],
});
```

## Role Hierarchy

Roles follow a hierarchical model:

```
admin (level 3)
  └─ Can access: admin, user, guest endpoints
user (level 2)
  └─ Can access: user, guest endpoints
guest (level 1)
  └─ Can access: guest endpoints
```

When you specify `requireRole: 'user'`, both **user** and **admin** can access it.

## Migration Guide

### Step 1: Import Utilities

```typescript
import { withAuth, successResponse, errorResponse } from "~/lib/api/auth";
```

### Step 2: Replace Manual Auth

**Before (58 lines):**

```typescript
export async function POST(request: NextRequest) {
  // Manual Bearer token check
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // ... 15+ lines of Bearer token setup
  } else {
    // ... 10+ lines of cookie auth
  }

  // Manual role check
  const { data: profile } = await supabase.from("users").select("role");
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Your logic...
  try {
    // ...
  } catch (error) {
    // ... 10+ lines of error handling
  }
}
```

**After (16 lines):**

```typescript
export const POST = withAuth(
  async (request, { user, supabase }) => {
    // user guaranteed to exist
    // Auth method auto-detected
    // Your logic...
  },
  { requireRole: "admin" },
);
```

**Result: 72% less code!**

### Step 3: Use Standard Responses

**Before:**

```typescript
return NextResponse.json({ error: "Not found" }, { status: 404 });
return NextResponse.json({ data: result }, { status: 200 });
```

**After:**

```typescript
return errorResponse("Not found", 404);
return successResponse({ data: result });
```

### Step 4: Test Thoroughly

Run your test suite and verify:

- ✅ Cookie authentication works (web app)
- ✅ Bearer token authentication works (extension)
- ✅ Authorization works (role checks)
- ✅ Error responses are consistent

## Examples

See [`USAGE_EXAMPLES.md`](./USAGE_EXAMPLES.md) for:

- Basic authentication patterns
- Role-based authorization
- Real refactoring examples
- Testing strategies
- Common patterns
- Best practices

## Benefits

| Aspect                   | Before                      | After                    |
| ------------------------ | --------------------------- | ------------------------ |
| **Code Lines**           | ~40 lines per route         | ~10 lines per route      |
| **Auth Detection**       | Manual if/else checks       | Automatic                |
| **Duplication**          | Auth code in every route    | Single source of truth   |
| **Type Safety**          | Manual null checks          | Guaranteed non-null user |
| **Error Consistency**    | Varies per route            | Standardized format      |
| **Testing**              | Mock Supabase in every test | Mock one utility         |
| **Bearer Token Support** | Implement per route         | Automatic                |
| **Role Checks**          | Manual database queries     | Single option            |
| **Maintenance**          | Update in multiple places   | Update once              |
| **Developer Experience** | Copy-paste boilerplate      | Import and use           |

## Security Considerations

### ✅ Best Practices

1. **Bearer Tokens**: Automatically supported, no manual detection needed
2. **Role Checks**: Use role hierarchy, don't hardcode permission checks
3. **Service Client**: Only use for webhooks/admin operations (not included in this utility)
4. **Validation**: Always validate request bodies before processing

### ❌ Common Mistakes

1. Manually checking for Bearer tokens (it's automatic)
2. Hardcoding role checks instead of using hierarchy
3. Forgetting to specify `requireRole` for protected endpoints
4. Not validating request bodies

## TypeScript Support

All utilities are fully typed:

```typescript
import type { AuthResult, ApiErrorResponse, AuthOptions } from "~/lib/api/auth";

// AuthResult gives you:
const { user, supabase } = authResult;
//      ^User     ^SupabaseClient (both typed)
```

## Testing

Mock the utilities in your tests:

```typescript
import { vi } from "vitest";
import * as auth from "~/lib/api/auth";

vi.spyOn(auth, "authenticateUser").mockResolvedValue({
  success: true,
  data: {
    user: mockUser,
    supabase: mockSupabase,
  },
});
```

## API Endpoints

### Discharge Orchestration

The discharge orchestration endpoint provides a unified API for executing multi-step discharge workflows:

- **Endpoint:** `POST /api/discharge/orchestrate`
- **Guide:** [`ORCHESTRATION_API_GUIDE.md`](./ORCHESTRATION_API_GUIDE.md) - Complete API guide with data verification scenarios
- **Quick Reference:** See [dual-mode-api documentation](../implementation/features/dual-mode-api/API_QUICK_REFERENCE.md)

**Features:**

- ✅ Dual input modes (raw data or existing case)
- ✅ Step-by-step workflow execution
- ✅ Parallel execution support
- ✅ Comprehensive data verification
- ✅ IDEXX extension integration ready

## Questions?

- See [`USAGE_EXAMPLES.md`](./USAGE_EXAMPLES.md) for detailed examples
- See [`auth.ts`](./auth.ts) for implementation details
- See [`ORCHESTRATION_API_GUIDE.md`](./ORCHESTRATION_API_GUIDE.md) for orchestration API verification

## Contributing

When adding new auth patterns:

1. Add utility to [`auth.ts`](./auth.ts)
2. Document in this README
3. Add examples to [`USAGE_EXAMPLES.md`](./USAGE_EXAMPLES.md)
4. Write tests
5. Update migration guide if needed

---

**Made with ❤️ for cleaner, more maintainable API routes.**
