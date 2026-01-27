# Mobile App Setup Checklist

Use this checklist to complete the setup:

## ✅ Step 1: Fix Dependencies

- [ ] Delete `node_modules` from Finder (Move to Trash)
- [ ] Run `pnpm install` to reinstall dependencies
- [ ] Verify no errors during installation

## ✅ Step 2: Environment Variables

- [ ] Copy template: `cp apps/mobile/.env.example apps/mobile/.env.local`
- [ ] Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from Clerk Dashboard
- [ ] Add `EXPO_PUBLIC_API_URL` (for local dev, use your machine's IP: `http://192.168.1.x:3000`)
- [ ] See `ENV_SETUP.md` in the repository root for detailed instructions

## ✅ Step 3: Clerk Configuration

- [ ] Visit https://dashboard.clerk.com
- [ ] Go to **User & Authentication → Social Connections**
- [ ] Enable **Google OAuth**
- [ ] Add iOS Bundle ID: `com.odisai.mobile`
- [ ] Add Android Package: `com.odisai.mobile`

## ✅ Step 4: App Assets (Optional - can use placeholders)

- [ ] Add `apps/mobile/assets/icon.png` (1024×1024)
- [ ] Add `apps/mobile/assets/splash-icon.png` (512×512)
- [ ] Add `apps/mobile/assets/adaptive-icon.png` (1024×1024)
- [ ] Add `apps/mobile/assets/favicon.png` (48×48)

Or use temporary placeholders for now.

## ✅ Step 5: Test Development Server

- [ ] Run `pnpm mobile:start`
- [ ] Verify Expo dev server starts without errors
- [ ] Scan QR code with Expo Go app (iOS/Android)
- [ ] OR run `pnpm mobile:ios` / `pnpm mobile:android`

## ✅ Step 6: Test Authentication

- [ ] Navigate to sign-in screen
- [ ] Try Google OAuth sign-in
- [ ] Try email/password sign-up
- [ ] Verify email verification flow works
- [ ] Check that protected routes are accessible after sign-in

## 🎉 You're Done!

Your mobile app is now set up and ready for development.

## Next Steps

1. **Customize UI** - Update colors in `tailwind.config.js`
2. **Add API Integration** - Connect to your backend API
3. **Add Features** - Build out the cases, dashboard, and settings screens
4. **Test on Devices** - Test on physical iOS/Android devices
5. **Set up EAS Build** - Configure for production builds

## Need Help?

- Expo Docs: https://docs.expo.dev
- Clerk Expo Docs: https://clerk.com/docs/quickstarts/expo
- NativeWind Docs: https://www.nativewind.dev
- Nx Expo Docs: https://nx.dev/nx-api/expo
