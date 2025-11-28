import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/dashboard/app-sidebar";
import { Separator } from "~/components/ui/separator";
import { DashboardBreadcrumb } from "~/components/dashboard/dashboard-breadcrumb";
import { getUser } from "~/server/actions/auth";
import { createClient } from "~/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Odis AI",
  description:
    "Access your veterinary practice management dashboard. View account information, manage settings, and get started with Odis AI.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Get full user profile from database for the sidebar
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role, clinic_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
        {/* Background Effects */}
        <div className="pointer-events-none fixed inset-0 z-0">
          {/* Animated gradient overlays */}
          <div
            style={{
              background:
                "radial-gradient(circle at 30% 40%, rgba(49, 171, 163, 0.08) 0%, rgba(49, 171, 163, 0.04) 40%, transparent 70%)",
            }}
            className="animate-gradient-move absolute inset-0 opacity-50 blur-sm"
          />
          <div
            style={{
              background:
                "radial-gradient(circle at 70% 60%, rgba(49, 171, 163, 0.06) 0%, rgba(49, 171, 163, 0.03) 50%, transparent 80%)",
            }}
            className="animate-gradient-move-reverse absolute inset-0 opacity-40 blur-sm"
          />
          {/* Floating orbs */}
          <div
            style={{
              background:
                "radial-gradient(circle, rgba(49, 171, 163, 0.04) 0%, transparent 60%)",
            }}
            className="animate-float-slow absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full opacity-30 blur-3xl"
          />
          <div
            style={{
              background:
                "radial-gradient(circle, rgba(49, 171, 163, 0.03) 0%, transparent 60%)",
            }}
            className="animate-float-slow-reverse absolute right-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-25 blur-3xl"
          />
        </div>
        {/* Dotted background pattern */}
        <div
          style={{
            backgroundImage:
              "radial-gradient(circle, #31aba3 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          className="pointer-events-none fixed inset-0 z-0 opacity-10"
        />
        <AppSidebar user={user} profile={profile} className="z-20" />
        <SidebarInset className="relative z-10 bg-transparent">
          <header className="transition-smooth flex h-16 shrink-0 items-center gap-2 ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="animate-fade-in-down flex items-center gap-2 px-4">
              <SidebarTrigger className="transition-smooth -ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DashboardBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
