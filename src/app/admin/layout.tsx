import { redirect } from "next/navigation";
import { getUser, signOut } from "~/server/actions/auth";
import { createClient } from "~/lib/supabase/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { LayoutDashboard, ClipboardList, LogOut } from "lucide-react";
import { Toaster } from "sonner";

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
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="dotted-background" />

      {/* Sidebar */}
      <aside className="relative z-10 w-64 border-r border-slate-200 bg-white/80 shadow-lg backdrop-blur-sm">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] p-6">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-teal-50">Template Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <NavLink href="/admin" icon={<LayoutDashboard size={20} />}>
              Dashboard
            </NavLink>
            <NavLink
              href="/admin/templates/soap"
              icon={<ClipboardList size={20} />}
            >
              SOAP Templates
            </NavLink>
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full border-slate-300 hover:bg-teal-50 hover:border-[#31aba3] hover:text-[#31aba3] transition-colors">
                Back to Dashboard
              </Button>
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="w-full justify-start text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-auto">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
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
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-gradient-to-r hover:from-[#31aba3]/10 hover:to-[#2a9a92]/5 hover:text-[#31aba3] hover:shadow-sm ${className}`}
    >
      <span className="transition-transform group-hover:scale-110 text-[#31aba3]">{icon}</span>
      {children}
    </Link>
  );
}
