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
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-64 border-r border bg-card shadow-sm">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b border p-6">
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Practice Management</p>
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
          <div className="border-t border p-4 space-y-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="w-full justify-start">
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
