import { getUser, signOut } from "~/server/actions/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/server";
import DashboardProfileHeader from "~/components/dashboard/DashboardProfileHeader";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Activity, ArrowRight, PhoneCall, FileText } from "lucide-react";
import Link from "next/link";

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
    <div className="space-y-8">
      <DashboardProfileHeader user={user} profile={profile} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Discharge Dashboard Card */}
        <Link href="/dashboard/cases" className="group block">
          <Card className="h-full border-slate-200 bg-white/80 transition-all hover:-translate-y-1 hover:border-[#31aba3]/30 hover:shadow-lg hover:shadow-[#31aba3]/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-slate-800">
                Discharges & Follow-ups
              </CardTitle>
              <PhoneCall className="h-5 w-5 text-[#31aba3] transition-transform group-hover:scale-110" />
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-500">
                Manage patient discharge summaries, automate follow-up calls,
                and track recovery progress.
              </p>
              <div className="flex items-center text-sm font-medium text-[#31aba3] opacity-0 transition-opacity group-hover:opacity-100">
                View Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Placeholder: Recent Activity */}
        <Card className="border-slate-200 bg-white/50 opacity-75">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-slate-600">
              Recent Activity
            </CardTitle>
            <Activity className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              View your recent system activity and logs.
            </p>
            <div className="mt-4 text-xs text-slate-400">Coming soon</div>
          </CardContent>
        </Card>

        {/* Placeholder: Reports */}
        <Card className="border-slate-200 bg-white/50 opacity-75">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-slate-600">
              Reports
            </CardTitle>
            <FileText className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Generate insights and practice performance reports.
            </p>
            <div className="mt-4 text-xs text-slate-400">Coming soon</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 flex justify-center">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
