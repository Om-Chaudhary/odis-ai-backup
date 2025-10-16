import { getUser, signOut } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Access your veterinary practice management dashboard. View account information, manage settings, and get started with Odis AI.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here&apos;s your account overview.
          </p>
        </header>

        <section
          className="grid gap-6 md:grid-cols-2"
          aria-label="Account overview"
        >
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  User ID
                </label>
                <p className="font-mono text-sm text-gray-900">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Role
                </label>
                <p className="text-sm text-gray-900 capitalize">
                  {user.user_metadata?.role ?? "veterinarian"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Sign In
                </label>
                <p className="text-sm text-gray-900">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your account and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="destructive" className="w-full">
                  Sign Out
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8" aria-label="Getting started guide">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Next steps to make the most of your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-blue-600">
                        1
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Complete your profile
                    </h3>
                    <p className="text-sm text-gray-500">
                      Add your name and bio to personalize your account
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        2
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Explore features
                    </h3>
                    <p className="text-sm text-gray-500">
                      Discover all the tools and features available to you
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        3
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Invite team members
                    </h3>
                    <p className="text-sm text-gray-500">
                      Collaborate with others by inviting them to your workspace
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
