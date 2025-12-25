import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/data-access/db/server";
import { AdminSidebar } from "~/components/admin/admin-sidebar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Admin | Odis AI",
  description:
    "Admin dashboard for managing scheduled items and clinic operations.",
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

  // Check admin role
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role, first_name, last_name, clinic_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <AdminSidebar user={user} profile={profile} />

      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </main>

      <Toaster richColors />
    </div>
  );
}
