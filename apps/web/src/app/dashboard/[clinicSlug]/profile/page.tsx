import { UserProfile } from "@clerk/nextjs";
import type { Metadata } from "next";
import { User2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile | Odis AI",
  description: "Manage your profile settings and account preferences",
};

/**
 * User Profile Page
 *
 * Uses Clerk's UserProfile component for complete profile management.
 * Features:
 * - Profile information (name, email, phone, avatar)
 * - Security settings (password, 2FA, active sessions)
 * - Connected accounts (OAuth providers)
 * - Account deletion
 */
export default function ProfilePage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex min-h-full w-full items-start justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-gray-200 rounded-xl w-full",
              navbar: "hidden", // Hide default navbar for cleaner integration
              pageScrollBox: "px-6 py-8",
              profileSectionTitleText: "text-lg font-semibold text-gray-900",
              profileSectionContent: "text-gray-700",
            },
          }}
          routing="path"
          path="/dashboard/:clinicSlug/profile"
        >
          {/* Custom notification preferences tab */}
          <UserProfile.Page
            label="Notifications"
            labelIcon={<User2 />}
            url="notifications"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Notification Preferences
                </h3>
                <p className="text-sm text-gray-600">
                  Manage how you receive notifications from Odis AI
                </p>
              </div>

              {/* Email Notifications */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Configure email notification preferences
                </p>
              </div>

              {/* Push Notifications */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Configure push notification preferences
                </p>
              </div>

              {/* Marketing Communications */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">
                  Marketing Communications
                </h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Manage marketing email preferences
                </p>
              </div>
            </div>
          </UserProfile.Page>
        </UserProfile>
        </div>
      </div>
    </div>
  );
}
