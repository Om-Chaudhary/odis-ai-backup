import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/db/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AdminSidebar } from "~/components/admin/shell/admin-sidebar";
import { AdminHeader } from "~/components/admin/shell/admin-header";

export const metadata: Metadata = {
  title: "Admin Dashboard | Odis AI",
  description: "Admin dashboard for managing accounts, cases, and discharges.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check role
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("users")
    .select("role, first_name, last_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    // Non-admins are redirected to regular dashboard
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-slate-50">
      {/* Admin Sidebar */}
      <AdminSidebar user={user} profile={profile} />

      {/* Main Content Area */}
      <main className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} profile={profile} />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          {children}
        </div>
      </main>

      <Toaster richColors />
    </div>
  );
}
