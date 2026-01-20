import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "~/server/actions/auth";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { AdminProvider } from "~/lib/admin-context";

export const metadata: Metadata = {
  title: "Admin | Odis AI",
  description:
    "Admin dashboard for managing clinics, users, and system operations.",
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

  // Check admin role - use service client for Clerk users who don't have Supabase session
  const supabase = await createServiceClient();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all clinics for admin context
  const { data: clinics } = await supabase
    .from("clinics")
    .select("*")
    .order("name");

  return <AdminProvider clinics={clinics ?? []}>{children}</AdminProvider>;
}
