import { getUser, signOut } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/server";
import DashboardProfileHeader from "~/components/dashboard/DashboardProfileHeader";
import DashboardProfileContent from "~/components/dashboard/DashboardProfileContent";

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
    <>
      <DashboardProfileHeader user={user} profile={profile} />
      <DashboardProfileContent user={user} profile={profile} />

      <div className="flex justify-end">
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="border-slate-300 transition-all hover:border-[#31aba3] hover:bg-teal-50 hover:text-[#31aba3] hover:shadow-md"
          >
            Sign Out
          </Button>
        </form>
      </div>
    </>
  );
}
