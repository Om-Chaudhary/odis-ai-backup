# Cal.com Embedding Best Practices

This document outlines the best practices for embedding Cal.com booking calendars in our Next.js 15 application.

## Implementation Overview

We use the official `@calcom/embed-react` package for embedding Cal.com calendars throughout the application.

### Components

1. **`CalEmbed`** (`apps/web/src/components/landing/shared/cal-embed.tsx`)
   - Core Cal.com embed component using `@calcom/embed-react`
   - Handles Cal.com API initialization and configuration
   - Sets theme and branding colors

2. **`CalEmbedWrapper`** (`apps/web/src/components/landing/shared/cal-embed-wrapper.tsx`)
   - Dynamic wrapper that prevents SSR issues
   - Provides loading state during initialization
   - Should be used instead of `CalEmbed` directly in pages

## Usage

### Basic Usage

```tsx
import { CalEmbedWrapper } from "~/components/landing/shared/cal-embed-wrapper";

export default function Page() {
  return (
    <CalEmbedWrapper
      calLink="your-username/event-type"
      className="min-h-[600px]"
    />
  );
}
```

### Direct Cal Component Usage (Advanced)

If you need more control, you can use the Cal component directly:

```tsx
"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export default function CalendarPage() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "your-namespace" });
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#14b8a6" } },
      });
    })();
  }, []);

  return (
    <Cal
      namespace="your-namespace"
      calLink="your-username/event-type"
      config={{ layout: "month_view", theme: "light" }}
      className="min-h-[600px]"
    />
  );
}
```

### Configuration

The embed is configured with:

- **Layout**: `month_view` - Shows full month calendar
- **Theme**: `light` - Light theme to match our design
- **Brand Color**: `#14b8a6` (teal) - Matches our primary color
- **Namespace**: Uses the `calLink` for unique identification

## Why Official Package?

### Previous Issues

The custom element registry error occurred when:

1. Manually loading Cal.com embed script
2. React components remounted during development (hot reload)
3. Custom elements tried to re-register with same name

### Solution Benefits

Using `@calcom/embed-react` package:

- ✅ Proper React lifecycle handling
- ✅ No custom element registration conflicts
- ✅ Better TypeScript support
- ✅ Designed for React/Next.js
- ✅ Handles cleanup automatically

## Troubleshooting

### Custom Element Registry Error

If you see: `Failed to execute 'define' on 'CustomElementRegistry'`

**Solution**: Always use `CalEmbedWrapper` instead of loading scripts manually.

### SSR Errors

If you encounter SSR issues:

**Solution**: The `CalEmbedWrapper` uses `dynamic` import with `ssr: false` to prevent server-side rendering issues.

### Styling Issues

To customize appearance:

1. Modify the `cal("ui", {...})` configuration in `CalEmbed`
2. Update `brandColor` to match design system
3. Use `className` prop for container styling

## Package Information

- **Package**: `@calcom/embed-react`
- **Version**: 1.5.3
- **Installation**: Added to `apps/web` workspace
- **Documentation**: [Cal.com Embed Docs](https://cal.com/docs/enterprise-features/embed)

### Important Notes

- **Default Import**: `Cal` is exported as default: `import Cal from "@calcom/embed-react"`
- **Named Import**: Only `getCalApi` is a named export: `import { getCalApi } from "@calcom/embed-react"`
- **Client Component**: Must use `"use client"` directive when using Cal components directly

## Related Files

- `/apps/web/src/components/landing/shared/cal-embed.tsx` - Core component
- `/apps/web/src/components/landing/shared/cal-embed-wrapper.tsx` - Wrapper with dynamic loading
- `/apps/web/src/app/(public)/demo/page.tsx` - Demo page implementation

## References

- [Cal.com Official Docs](https://cal.com/docs)
- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React 19 Compatibility](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
