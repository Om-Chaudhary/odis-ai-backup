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
    .select(
      "first_name, last_name, role, clinic_name, license_number, avatar_url",
    )
    .eq("id", user.id)
    .single();

  return (
    <DarkModeWrapper>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle, #31aba3 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Animated gradient overlay */}
          <div
            style={{
              background:
                "radial-gradient(circle at 30% 40%, rgba(49, 171, 163, 0.12) 0%, rgba(49, 171, 163, 0.06) 40%, transparent 70%)",
            }}
            className="animate-gradient-move absolute inset-0 opacity-70 blur-sm"
          />

          {/* Secondary moving gradient */}
          <div
            style={{
              background:
                "radial-gradient(circle at 70% 60%, rgba(49, 171, 163, 0.10) 0%, rgba(49, 171, 163, 0.05) 50%, transparent 80%)",
            }}
            className="animate-gradient-move-reverse absolute inset-0 opacity-50 blur-sm"
          />

          {/* Floating accent orbs */}
          <div
            style={{
              background:
                "radial-gradient(circle, rgba(49, 171, 163, 0.06) 0%, transparent 60%)",
            }}
            className="animate-float-slow absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl transition-opacity duration-1000 hover:opacity-60"
          />
          <div
            style={{
              background:
                "radial-gradient(circle, rgba(49, 171, 163, 0.05) 0%, transparent 60%)",
            }}
            className="animate-float-slow-reverse absolute right-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-35 blur-3xl transition-opacity duration-1000 hover:opacity-50"
          />
        </div>

        <div className="relative z-10 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <DashboardProfileHeader user={user} profile={profile} />
            <DashboardProfileContent user={user} profile={profile} />

            <div className="flex justify-end">
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="destructive"
                  className="shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </DarkModeWrapper>
  );
}
