import { redirect } from "next/navigation";
import { getUser, signOut } from "~/server/actions/auth";
import { createClient } from "~/lib/supabase/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { LayoutDashboard, ClipboardList, LogOut, FileText, Briefcase, Users } from "lucide-react";
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
      <div className="flex min-h-screen relative overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-100/40 to-emerald-50/30">
        {/* Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, #31aba3 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          
          {/* Animated gradient overlay */}
          <div
            className="animate-gradient-move absolute inset-0 opacity-30 blur-sm"
            style={{
              background:
                "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 40%, transparent 70%)",
            }}
          />

          {/* Secondary moving gradient */}
          <div
            className="animate-gradient-move-reverse absolute inset-0 opacity-20 blur-sm"
            style={{
              background:
                "radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.10) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%)",
            }}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200/60 bg-white/90 backdrop-blur-md shadow-xl relative z-10">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b border-slate-200/60 p-6 bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-[#31aba3] to-slate-700 bg-clip-text text-transparent">Admin Panel</h1>
            <p className="text-sm text-slate-600 font-medium">Practice Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <NavLink href="/admin" icon={<LayoutDashboard size={20} />}>
              Dashboard
            </NavLink>

            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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

            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
          <div className="border-t border-slate-200/60 p-4 space-y-2 bg-gradient-to-r from-emerald-50/40 to-teal-50/20">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full border-slate-300 hover:bg-teal-50 hover:border-[#31aba3] hover:text-[#31aba3] transition-all hover:shadow-md">
                Back to Dashboard
              </Button>
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-all">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto p-8">
          {children}
        </div>
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
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground ${className}`}
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      {children}
    </Link>
  );
}
