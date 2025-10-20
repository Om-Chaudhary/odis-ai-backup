import { redirect } from "next/navigation";
import { getUser } from "~/server/actions/auth";
import { createClient } from "~/lib/supabase/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  FileText,
  Users,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";
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
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b p-6">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Template Management</p>
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
          <div className="border-t p-4">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white dark:bg-gray-950">
        <div className="container mx-auto p-8 text-gray-900 dark:text-gray-100">{children}</div>
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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 ${className}`}
    >
      {icon}
      {children}
    </Link>
  );
}
