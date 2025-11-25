import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getUser } from "~/server/actions/auth";
import { createClient } from "~/lib/supabase/server";
import { AppSidebar } from "~/components/dashboard/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";

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
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const user = await getUser();

  let profile = null;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select(
        "first_name, last_name, role, clinic_name, license_number, avatar_url",
      )
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar user={user} profile={profile} />
      <SidebarInset className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
        {/* Background Effects */}
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

        <header className="relative z-20 flex h-16 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="relative z-10 flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
