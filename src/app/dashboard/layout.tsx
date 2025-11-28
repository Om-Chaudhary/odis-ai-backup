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
      <div className="relative flex min-h-screen w-full bg-slate-50/50">
        <div className="dotted-background fixed inset-0 z-0" />
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
