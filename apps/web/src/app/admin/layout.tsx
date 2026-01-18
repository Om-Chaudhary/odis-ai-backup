import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "~/server/actions/auth";
import { createClient } from "@odis-ai/data-access/db/server";
import { AdminSidebar } from "~/components/admin/admin-sidebar";
import { AdminHeader } from "~/components/admin/layout/admin-header";
import { AdminProvider } from "~/lib/admin-context";
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

export const dynamic = "force-dynamic";

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

  // Fetch all clinics for admin context
  const { data: clinics = [] } = await supabase
    .from("clinics")
    .select("*")
    .order("name");

  return (
    <AdminProvider clinics={clinics}>
      <div className="flex h-screen w-full overflow-hidden">
        <AdminSidebar user={user} profile={profile} />

        <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {/* Layered background for depth */}
          <div className="pointer-events-none absolute inset-0">
            {/* Base gradient - warm white to subtle teal tint */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #fafbfc 0%, #f8fafa 25%, #f5f9f9 50%, #f3f8f8 75%, #f0f7f6 100%)",
              }}
            />
            {/* Subtle radial glow from top-left corner */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 0% 0%, rgba(49, 171, 163, 0.04) 0%, transparent 50%)",
              }}
            />
            {/* Subtle dot pattern for texture */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="relative z-10 flex h-full flex-col">
            <AdminHeader />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
              {children}
            </div>
          </div>
        </main>

        <Toaster richColors />
      </div>
    </AdminProvider>
  );
}
