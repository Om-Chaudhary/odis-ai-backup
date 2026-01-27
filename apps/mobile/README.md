# OdisAI Mobile App

React Native Expo app for iOS and Android with Clerk authentication and NativeWind styling.

## Prerequisites

- Node.js 20+
- pnpm 10+
- iOS: Xcode and iOS Simulator
- Android: Android Studio and Android Emulator

## Setup

### 1. Install Dependencies

There was an issue with node_modules permissions. To fix:

```bash
# Delete node_modules from Finder (Move to Trash)
# OR use this command:
sudo rm -rf node_modules

# Then reinstall
pnpm install
```

### 2. Environment Variables

Create `apps/mobile/.env.local`:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
EXPO_PUBLIC_API_URL=https://api.odisai.net
```

Get your Clerk publishable key from: https://dashboard.clerk.com

### 3. Configure Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Navigate to **User & Authentication → Social Connections**
3. Enable **Google OAuth**
4. Add application identifiers:
   - iOS Bundle ID: `com.odisai.mobile`
   - Android Package: `com.odisai.mobile`

### 4. Add App Assets

Replace placeholder files in `apps/mobile/assets/`:

- `icon.png` (1024×1024) - Main app icon
- `splash-icon.png` (512×512) - Splash screen icon
- `adaptive-icon.png` (1024×1024) - Android adaptive icon
- `favicon.png` (48×48) - Web favicon

See `apps/mobile/assets/README.md` for design guidelines.

## Development

```bash
# Start Expo dev server
pnpm mobile:start

# Run on iOS (requires Xcode)
pnpm mobile:ios

# Run on Android (requires Android Studio)
pnpm mobile:android

# Generate native projects (advanced)
pnpm mobile:prebuild
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router routes
│   ├── _layout.tsx         # Root layout (ClerkProvider)
│   ├── index.tsx           # Entry redirect
│   ├── sso-callback.tsx    # OAuth callback
│   ├── (auth)/             # Public auth routes
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── verify-email.tsx
│   └── (app)/              # Protected routes (tab nav)
│       ├── index.tsx       # Dashboard
│       ├── cases/          # Case management
│       ├── settings/       # User settings
│       └── profile/        # User profile
├── src/
│   ├── components/
│   │   └── auth/           # Auth components
│   ├── hooks/
│   │   └── use-google-auth.ts
│   ├── lib/
│   │   └── clerk.ts        # Token cache
│   └── styles/
│       └── global.css      # NativeWind styles
├── assets/                 # App icons and images
├── app.json               # Expo config
├── babel.config.js        # Babel + NativeWind
├── metro.config.js        # Metro bundler
└── tailwind.config.js     # Tailwind theme
```

## Shared UI Library

Reusable NativeWind components in `libs/mobile/ui/`:

```tsx
import { Button, Card, Input, Text } from "@odis-ai/mobile/ui";

<Card>
  <Text variant="heading" size="2xl">Welcome</Text>
  <Input label="Email" placeholder="Enter email" />
  <Button onPress={handleSubmit}>
    <Text className="text-white">Submit</Text>
  </Button>
</Card>
```

## Authentication Flow

1. **Root Layout** (`app/_layout.tsx`) - Wraps app with `ClerkProvider`
2. **Auth Gate** - Redirects based on auth state:
   - Signed out → `/(auth)/sign-in`
   - Signed in → `/(app)/`
3. **Sign In** - Email/password + Google OAuth
4. **Sign Up** - Registration with email verification
5. **Verify Email** - 6-digit code verification
6. **Protected Routes** - Tab navigation (Dashboard, Cases, Settings, Profile)

## Reusable Libraries

### Can Reuse (Platform-independent)
- `@odis-ai/shared/types`
- `@odis-ai/shared/validators`
- `@odis-ai/shared/constants`
- `@odis-ai/shared/util` (partial)

### Cannot Reuse (Web-specific)
- `@odis-ai/shared/ui` (uses Radix UI)
- `@odis-ai/shared/hooks` (uses DOM APIs)
- `@odis-ai/data-access/*` (server-side)

## Troubleshooting

### Metro bundler issues
```bash
# Clear Metro cache
npx expo start -c
```

### Module resolution errors
```bash
# Verify paths in tsconfig.base.json
# Restart Metro bundler
```

### iOS build issues
```bash
# Clean build
cd ios && pod deintegrate && pod install && cd ..
pnpm mobile:ios
```

### Android build issues
```bash
# Clean Gradle
cd android && ./gradlew clean && cd ..
pnpm mobile:android
```

## Production Build

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android

# Configure EAS: https://docs.expo.dev/build/setup/
```

## Tech Stack

- **Framework**: Expo SDK 53 + React Native 0.77
- **Routing**: Expo Router 5 (file-based)
- **Auth**: Clerk Expo
- **Styling**: NativeWind 4 (Tailwind for RN)
- **UI**: Custom components in `@odis-ai/mobile/ui`
- **Icons**: lucide-react-native
- **Monorepo**: Nx 22
