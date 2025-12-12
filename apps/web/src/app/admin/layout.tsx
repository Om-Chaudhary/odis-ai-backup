import { redirect } from "next/navigation";
import { getUser, signOut } from "~/server/actions/auth";
import { createClient } from "@odis-ai/db/server";
import Link from "next/link";
import { Button } from "@odis-ai/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  FileText,
  Briefcase,
  Users,
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  Flag,
  FlaskConical,
} from "lucide-react";
import { Toaster } from "sonner";
import { DarkModeWrapper } from "~/components/providers/dark-mode-wrapper";

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
      <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
        {/* Sidebar */}
        <aside className="relative z-10 w-64 border-r border-slate-200 bg-white shadow-lg">
          <div className="flex h-full flex-col">
            {/* Logo/Header */}
            <div className="border-b border-slate-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
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
                  Communications
                </p>
              </div>
              <NavLink href="/admin/discharges" icon={<FileText size={20} />}>
                Discharges
              </NavLink>
              <NavLink
                href="/admin/inbound-calls"
                icon={<PhoneIncoming size={20} />}
              >
                Inbound Calls
              </NavLink>

              <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  Triage
                </p>
              </div>
              <NavLink
                href="/admin/discharge-calls"
                icon={<PhoneOutgoing size={20} />}
              >
                Discharge Calls
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

              <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  Testing
                </p>
              </div>
              <NavLink href="/admin/vapi-test" icon={<Phone size={20} />}>
                Vapi Test
              </NavLink>
              <NavLink
                href="/admin/soap-playground"
                icon={<FlaskConical size={20} />}
              >
                SOAP Playground
              </NavLink>
              <NavLink href="/admin/feature-flags" icon={<Flag size={20} />}>
                Feature Flags
              </NavLink>
            </nav>

            {/* Footer */}
            <div className="space-y-2 border-t border-slate-200 bg-teal-50/50 p-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 bg-white text-slate-700 transition-all hover:border-teal-600 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md"
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
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-teal-50 hover:text-teal-700 ${className}`}
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      {children}
    </Link>
  );
}
