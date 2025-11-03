import { getUser, signOut } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import type { Metadata } from "next";
import { createClient } from "~/lib/supabase/server";
import { DarkModeWrapper } from "~/components/DarkModeWrapper";
import DashboardProfileHeader from "~/components/dashboard/DashboardProfileHeader";
import DashboardProfileContent from "~/components/dashboard/DashboardProfileContent";

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

  // Get full user profile from database
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, clinic_name, license_number, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <DarkModeWrapper>
      <main className="bg-background min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <DashboardProfileHeader user={user} profile={profile} />
          <DashboardProfileContent user={user} profile={profile} />

          <div className="flex justify-end">
            <form action={signOut}>
              <Button type="submit" variant="destructive">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </main>
    </DarkModeWrapper>
  );
}
