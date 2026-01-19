import { OrganizationProfile } from "@clerk/nextjs";
import { Settings, WifiSyncIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Management | Odis AI",
  description: "Manage team members, roles, and clinic settings",
};

/**
 * Team Management Page
 *
 * Uses Clerk's OrganizationProfile component for complete team and organization management.
 * Features:
 * - Team member list with roles
 * - Invite new team members
 * - Manage member roles (Owner, Admin, Veterinarian, Member, Viewer)
 * - Remove team members
 * - Pending invitations management
 * - Organization settings
 */
export default function TeamPage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex min-h-full w-full items-start justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
        <OrganizationProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-gray-200 rounded-xl w-full",
              navbar: "hidden", // Hide default navbar for cleaner integration
              pageScrollBox: "px-6 py-8",
              profileSectionTitleText: "text-lg font-semibold text-gray-900",
              profileSectionContent: "text-gray-700",
              // Member table styling
              membersList: "mt-4",
              membersListTable: "w-full border-collapse",
              membersListTableRow: "border-b border-gray-200 hover:bg-gray-50",
              // Invite button
              organizationProfileSectionTitle:
                "text-xl font-bold text-gray-900",
            },
          }}
          routing="path"
          path="/dashboard/:clinicSlug/team"
        >
          {/* Custom VAPI Settings Tab */}
          <OrganizationProfile.Page
            labelIcon={<Settings />}
            label="VAPI Settings"
            url="vapi"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  VAPI Voice AI Configuration
                </h3>
                <p className="text-sm text-gray-600">
                  Configure VAPI voice AI settings for your clinic
                </p>
              </div>

              {/* VAPI Assistant Configuration */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">
                  Assistant Configuration
                </h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Configure VAPI assistant settings (voice,
                  personality, instructions)
                </p>
              </div>

              {/* Phone Number Configuration */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">
                  Phone Number Settings
                </h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Manage phone numbers and call routing
                </p>
              </div>
            </div>
          </OrganizationProfile.Page>

          {/* Custom PIMS Sync Tab */}
          <OrganizationProfile.Page
            labelIcon={<WifiSyncIcon />}
            label="PIMS Sync"
            url="pims"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Practice Management Integration
                </h3>
                <p className="text-sm text-gray-600">
                  Connect and sync with your PIMS (IDEXX Neo, ezyVet, etc.)
                </p>
              </div>

              {/* IDEXX Neo Integration */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">IDEXX Neo</h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Configure IDEXX Neo credentials and sync settings
                </p>
              </div>

              {/* Sync History */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">Sync History</h4>
                <p className="text-sm text-gray-600">
                  Coming soon: View recent sync activity and status
                </p>
              </div>
            </div>
          </OrganizationProfile.Page>

          {/* Custom Clinic Settings Tab */}
          <OrganizationProfile.Page
            labelIcon={<Settings />}
            label="Clinic Settings"
            url="clinic"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Clinic Configuration
                </h3>
                <p className="text-sm text-gray-600">
                  Manage clinic-specific settings and preferences
                </p>
              </div>

              {/* Business Hours */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">Business Hours</h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Configure clinic hours and call scheduling
                  preferences
                </p>
              </div>

              {/* Communication Preferences */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900">
                  Communication Preferences
                </h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Set default communication preferences for
                  discharge calls
                </p>
              </div>
            </div>
          </OrganizationProfile.Page>
        </OrganizationProfile>
        </div>
      </div>
    </div>
  );
}
