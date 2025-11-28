import { getUser, signOut } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/server";
import DashboardProfileHeader from "~/components/dashboard/DashboardProfileHeader";
import { DashboardContentWithTabs } from "~/components/dashboard/dashboard-content-with-tabs";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Get full user profile from database
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, clinic_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <DashboardProfileHeader user={user} profile={profile} />
      </div>

      <div className="animate-fade-in-up stagger-1 h-px bg-slate-200/50" />

      <div className="animate-fade-in-up stagger-2">
        <DashboardContentWithTabs />
      </div>

      <div className="animate-fade-in-up stagger-3 flex justify-center py-8">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="transition-smooth text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
