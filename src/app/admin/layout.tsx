import { redirect } from "next/navigation";
import { getUser, signOut } from "~/server/actions/auth";
import { createClient } from "~/lib/supabase/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  FileText,
  Briefcase,
  Users,
} from "lucide-react";
import { Toaster } from "sonner";
import { DarkModeWrapper } from "~/components/DarkModeWrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Check admin role
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <DarkModeWrapper>
      <div className="relative flex min-h-screen overflow-hidden bg-teal-50/60">
        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-cyan-100/40" />
        </div>

        {/* Sidebar */}
        <aside className="relative z-10 w-64 border-r border-slate-200 bg-white/90 shadow-xl backdrop-blur-md">
          <div className="flex h-full flex-col">
            {/* Logo/Header */}
            <div className="border-b border-slate-200 bg-gradient-to-r from-teal-50/50 to-cyan-100/40 p-6">
              <h1 className="font-display text-xl font-bold text-slate-800">
                Admin Panel
              </h1>
              <p className="text-sm text-slate-600">Practice Management</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              <NavLink href="/admin" icon={<LayoutDashboard size={20} />}>
                Dashboard
              </NavLink>

              <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  Templates
                </p>
              </div>
              <NavLink
                href="/admin/templates/soap"
                icon={<ClipboardList size={20} />}
              >
                SOAP Templates
              </NavLink>
              <NavLink
                href="/admin/templates/discharge"
                icon={<FileText size={20} />}
              >
                Discharge Templates
              </NavLink>

              <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  Management
                </p>
              </div>
              <NavLink href="/admin/cases" icon={<Briefcase size={20} />}>
                Cases
              </NavLink>
              <NavLink href="/admin/users" icon={<Users size={20} />}>
                Users
              </NavLink>
            </nav>

            {/* Footer */}
            <div className="space-y-2 border-t border-slate-200 bg-gradient-to-r from-teal-50/30 to-cyan-100/20 p-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 bg-white/90 text-slate-700 transition-all hover:border-teal-500 hover:bg-teal-50 hover:text-teal-600 hover:shadow-md"
                >
                  Back to Dashboard
                </Button>
              </Link>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start text-slate-700 transition-all hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative z-10 flex-1 overflow-auto">
          <div className="container mx-auto p-8">{children}</div>
        </main>
        <Toaster />
      </div>
    </DarkModeWrapper>
  );
}

function NavLink({
  href,
  icon,
  children,
  className = "",
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-teal-50 hover:text-teal-600 ${className}`}
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      {children}
    </Link>
  );
}
