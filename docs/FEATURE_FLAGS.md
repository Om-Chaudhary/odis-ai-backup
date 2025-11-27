# Feature Flags Guide

This project uses [Vercel Flags SDK](https://flags-sdk.dev/) for feature flag management.

## Overview

Feature flags allow you to:

- Roll out features gradually
- A/B test functionality
- Toggle features without redeployment
- Control experimental features

## Current Flags

### `enable-voicemail-detection`

**Location**: `src/flags.ts`

Controls automatic voicemail detection and message leaving for VAPI calls.

**When Enabled**:

- VAPI automatically detects voicemail systems
- Leaves a personalized message using dynamic variables
- Ends the call after leaving the message

**When Disabled**:

- VAPI attempts calls normally without voicemail detection
- Assistant handles voicemail based on system prompt only

**Default**: `false` (disabled)

## Usage

### In Server Components

```typescript
import { enableVoicemailDetection } from "~/flags";

export default async function MyComponent() {
  const voicemailEnabled = await enableVoicemailDetection();

  if (voicemailEnabled) {
    // Feature is enabled
  }

  return <div>...</div>;
}
```

### In API Routes

```typescript
import { enableVoicemailDetection } from "~/flags";

export async function POST(request: Request) {
  const voicemailEnabled = await enableVoicemailDetection();

  if (voicemailEnabled) {
    // Feature is enabled
  }

  return NextResponse.json({ success: true });
}
```

## Managing Flags

### View Current State

Visit `/admin/feature-flags` in your browser to see the current state of all feature flags.

### Change Flag Values

#### Method 1: Code (Simple)

Edit `src/flags.ts`:

```typescript
export const enableVoicemailDetection = flag({
  key: "enable-voicemail-detection",
  defaultValue: true, // Change to true to enable
  decide() {
    return true; // Or use conditional logic
  },
});
```

#### Method 2: Environment Variables

```typescript
export const enableVoicemailDetection = flag({
  key: "enable-voicemail-detection",
  decide() {
    return process.env.ENABLE_VOICEMAIL === "true";
  },
});
```

Then set in `.env.local`:

```
ENABLE_VOICEMAIL=true
```

#### Method 3: Vercel Edge Config (Production)

For runtime control without redeployment:

1. **Create Edge Config in Vercel Dashboard**:
   - Go to your project → Storage → Create Edge Config
   - Name it (e.g., "feature-flags")

2. **Add configuration items**:

   ```json
   {
     "enable-voicemail-detection": true
   }
   ```

3. **Update flag configuration**:

```typescript
import { flag } from "flags/next";
import { get } from "@vercel/edge-config";

export const enableVoicemailDetection = flag({
  key: "enable-voicemail-detection",
  async decide() {
    const value = await get("enable-voicemail-detection");
    return value === true;
  },
});
```

4. **Set environment variable**:
   ```
   EDGE_CONFIG=https://edge-config.vercel.com/...
   ```

## Adding New Flags

1. **Define the flag in `src/flags.ts`**:

```typescript
export const myNewFeature = flag({
  key: "my-new-feature",
  description: "Description of what this flag controls",
  defaultValue: false,
  decide() {
    return false; // Your logic here
  },
});
```

2. **Use the flag in your code**:

```typescript
import { myNewFeature } from "~/flags";

const isEnabled = await myNewFeature();
```

3. **Add to admin UI** (`src/app/admin/feature-flags/page.tsx`):

```tsx
const myFeatureEnabled = await myNewFeature();

// Add a card to display the flag state
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>My New Feature</CardTitle>
        <CardDescription>Description of the feature</CardDescription>
      </div>
      <Badge variant={myFeatureEnabled ? "default" : "secondary"}>
        {myFeatureEnabled ? "Enabled" : "Disabled"}
      </Badge>
    </div>
  </CardHeader>
</Card>;
```

## Best Practices

1. **Start Disabled**: New flags should default to `false` for safety
2. **Document Purpose**: Always include a description of what the flag controls
3. **Clean Up**: Remove flags after full rollout or feature removal
4. **Server-Only**: Keep flag evaluation server-side for consistency
5. **No Arguments**: Don't pass parameters to flag functions (keep them simple)

## Resources

- [Flags SDK Documentation](https://flags-sdk.dev/)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)
- [Flag Providers](https://flags-sdk.dev/providers)
