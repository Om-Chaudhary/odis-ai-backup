# API Authentication Utilities - Usage Examples

Clean, reusable authentication for Next.js API routes with **automatic detection** of cookies or Bearer tokens.

## Key Features

- ✅ **Auto-detection** - Automatically handles both cookie and Bearer token auth
- ✅ **Role-based** - Simple role hierarchy (admin > user > guest)
- ✅ **Type-safe** - Full TypeScript support with guaranteed non-null user
- ✅ **DRY** - No repeated authentication boilerplate
- ✅ **Consistent** - Standardized error/success responses

---

## Basic Usage

### Simple Authenticated Route

```typescript
// src/app/api/profile/route.ts
import { withAuth, successResponse } from "~/lib/api/auth";

export const GET = withAuth(async (request, { user, supabase }) => {
  // user and supabase are guaranteed to exist
  // Works for both cookie-based (web) and Bearer token (extension) auth

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return successResponse({ profile: data });
});
```

**No configuration needed!** Authentication method is automatically detected.

---

## Extension Support (Automatic)

The same route works for **both** web app and browser extension:

```typescript
// src/app/api/data/route.ts
import { withAuth, successResponse, errorResponse } from "~/lib/api/auth";

export const POST = withAuth(async (request, { user, supabase }) => {
  const body = await request.json();

  // This works whether the request comes from:
  // 1. Web app (cookies)
  // 2. Browser extension (Bearer token)
  // No extra configuration required!

  const { data, error } = await supabase
    .from("user_data")
    .insert({ user_id: user.id, ...body });

  if (error) {
    return errorResponse("Failed to save data", 500);
  }

  return successResponse({ data }, 201);
});
```

**Client usage:**

```typescript
// Web app (uses cookies automatically)
fetch("/api/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data: "..." }),
});

// Browser extension (pass Bearer token)
fetch("https://yourapp.com/api/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userToken}`, // Supabase session token
  },
  body: JSON.stringify({ data: "..." }),
});
```

---

## Role-Based Authorization

Restrict endpoints to specific user roles:

```typescript
// src/app/api/admin/users/route.ts
import { withAuth, successResponse, errorResponse } from "~/lib/api/auth";

// Only admins can list users
export const GET = withAuth(
  async (request, { supabase }) => {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      return errorResponse("Failed to fetch users", 500);
    }

    return successResponse({ users: data });
  },
  {
    requireRole: "admin", // 👈 Only admins can access
  },
);

// Custom error message
export const DELETE = withAuth(
  async (request, { supabase }) => {
    const { id } = await request.json();

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      return errorResponse("Failed to delete user", 500);
    }

    return successResponse({ deleted: true });
  },
  {
    requireRole: "admin",
    messages: {
      forbidden: "Only administrators can delete users",
    },
  },
);
```

**Role hierarchy:**

```
admin (level 3)
  └─ Can access: admin, user, guest endpoints
user (level 2)
  └─ Can access: user, guest endpoints
guest (level 1)
  └─ Can access: guest endpoints
```

---

## Manual Authentication (Advanced)

For complex cases where you need custom logic:

```typescript
// src/app/api/complex/route.ts
import { NextRequest } from "next/server";
import { authenticateUser, errorResponse, successResponse } from "~/lib/api/auth";

export async function POST(request: NextRequest) {
  // Manually authenticate
  const auth = await authenticateUser(request);

  if (!auth.success) {
    return auth.response;
  }

  const { user, supabase } = auth.data;

  // Custom authorization logic
  const ipAddress = request.headers.get("x-forwarded-for");
  if (!isAllowedIP(ipAddress)) {
    return errorResponse("IP not allowed", 403);
  }

  // Rate limiting
  const isRateLimited = await checkRateLimit(user.id);
  if (isRateLimited) {
    return errorResponse("Rate limit exceeded", 429);
  }

  // Your route logic
  const data = await request.json();
  // ...

  return successResponse({ success: true });
}
```

---

## Refactoring Example

### Before

```typescript
// ❌ 58 lines of boilerplate
export async function POST(request: NextRequest) {
  try {
    // Manual authentication (15+ lines)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        },
      );
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const user = await getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Manual role check (10+ lines)
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Actual logic (10 lines)
    const body = await request.json();
    const result = await processData(body);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### After

```typescript
// ✅ 16 lines - 72% reduction!
import { withAuth, successResponse, errorResponse } from "~/lib/api/auth";

export const POST = withAuth(
  async (request, { user, supabase }) => {
    // Authentication & authorization handled automatically
    // Focus only on business logic

    const body = await request.json();

    const result = await processData(body);

    return successResponse({ data: result });
  },
  {
    requireRole: "admin", // Simple role check
  },
);
```

**Benefits:**

- ✅ **72% less code** (58 → 16 lines)
- ✅ Auto-detects authentication method
- ✅ Type-safe (user guaranteed non-null)
- ✅ Consistent error responses
- ✅ Easy to test (mock one function)
- ✅ Maintainable (update once, applies everywhere)

---

## Error Response Helpers

Standardized error and success responses:

```typescript
import { errorResponse, successResponse } from "~/lib/api/auth";

// Error with validation details
return errorResponse("Validation failed", 400, {
  errors: [
    { field: "email", message: "Invalid email format" },
    { field: "phone", message: "Phone number required" },
  ],
});

// Simple error
return errorResponse("Not found", 404);

// Success with custom status
return successResponse({ id: 123, name: "Test" }, 201);
```

---

## Common Patterns

### Pattern 1: Public + Authenticated Endpoints

```typescript
// Public endpoint (no auth)
export async function GET() {
  return NextResponse.json({ message: "Public data" });
}

// Authenticated endpoint
export const POST = withAuth(async (request, { user, supabase }) => {
  // ... authenticated logic
});
```

### Pattern 2: Optional Authentication

```typescript
export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);

  if (auth.success) {
    // Return personalized data
    const { user, supabase } = auth.data;
    const data = await getPersonalizedData(user.id, supabase);
    return successResponse({ data });
  } else {
    // Return public data
    const data = await getPublicData();
    return successResponse({ data });
  }
}
```

### Pattern 3: Multiple HTTP Methods

```typescript
// src/app/api/posts/route.ts
import { withAuth, successResponse, errorResponse } from "~/lib/api/auth";

// Anyone can read
export async function GET() {
  // ... public logic
}

// Authenticated users can create
export const POST = withAuth(async (request, { user, supabase }) => {
  // ... create post
});

// Only admins can delete
export const DELETE = withAuth(
  async (request, { supabase }) => {
    // ... delete post
  },
  { requireRole: "admin" },
);
```

---

## Testing

Mock the authentication utilities:

```typescript
import { vi } from "vitest";
import * as auth from "~/lib/api/auth";

// Mock authenticateUser
vi.spyOn(auth, "authenticateUser").mockResolvedValue({
  success: true,
  data: {
    user: {
      id: "test-user-id",
      email: "test@example.com",
    },
    supabase: mockSupabaseClient,
  },
});

// Test your route
const response = await POST(mockRequest, {});
expect(response.status).toBe(200);
```

---

## Migration Checklist

When migrating existing routes:

1. ✅ Import `withAuth`, `successResponse`, `errorResponse` from `~/lib/api/auth`
2. ✅ Replace manual authentication with `withAuth`
3. ✅ Remove Bearer token detection code (automatic now)
4. ✅ Replace custom error responses with helpers
5. ✅ Add `requireRole` if endpoint needs authorization
6. ✅ Update tests to mock new utilities
7. ✅ Test both cookie and Bearer token auth

---

## Best Practices

### ✅ Do

- Use `withAuth` for all authenticated routes
- Use `requireRole` for admin-only routes
- Use `successResponse` and `errorResponse` for consistency
- Keep route handlers focused on business logic
- Test both cookie and Bearer token authentication

### ❌ Don't

- Don't manually check for Bearer tokens (automatic)
- Don't duplicate authentication logic
- Don't hardcode error messages
- Don't forget to specify role requirements
- Don't use manual try-catch (handled by wrapper)

---

## API Reference

### `withAuth(handler, options?)`

Creates authenticated route with auto-detection.

**Parameters:**

- `handler(request, { user, supabase }, context)` - Your route handler
- `options` - Optional configuration:
  - `requireRole?: 'admin' | 'user' | 'guest'` - Required role
  - `messages?: { unauthorized?, forbidden? }` - Custom messages

**Example:**

```typescript
export const POST = withAuth(
  async (request, { user, supabase }) => {
    // Your logic
  },
  { requireRole: "admin" },
);
```

### `authenticateUser(request, options?)`

Manual authentication for complex cases.

**Returns:**

```typescript
Promise<
  | { success: true; data: { user: User; supabase: SupabaseClient } }
  | { success: false; response: NextResponse }
>;
```

### `successResponse(data, status?)`

```typescript
successResponse({ id: 123 }, 201);
// Returns: NextResponse with JSON body and 201 status
```

### `errorResponse(error, status?, details?)`

```typescript
errorResponse("Not found", 404);
// Returns: { "error": "Not found" } with 404 status

errorResponse("Validation failed", 400, {
  errors: [{ field: "email", message: "Invalid" }],
});
```

---

## Questions?

See [README.md](./README.md) for more details or check the source code in [auth.ts](./auth.ts).
