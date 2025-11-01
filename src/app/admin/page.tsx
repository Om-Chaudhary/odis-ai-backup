import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ClipboardList, Plus, FlaskConical, LayoutDashboard, Users, UserPlus } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-[#31aba3] to-[#2a9a92] p-3 shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-base text-slate-600">
          Manage users, SOAP templates, and system configuration
        </p>
      </div>

      {/* User Management */}
      <Card className="border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-200">
          <CardTitle className="text-xl text-slate-900">User Management</CardTitle>
          <CardDescription className="text-slate-600">Manage user accounts and onboarding</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
          <Link href="/admin/users/new" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02] bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30"
              variant="default"
            >
              <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                <UserPlus className="h-6 w-6" />
              </div>
              <span className="font-semibold">
                Add New User
              </span>
            </Button>
          </Link>
          <Link href="/admin/users" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02] border-2 border-slate-200 hover:border-[#31aba3] hover:bg-teal-50/50 text-slate-700 hover:text-[#31aba3] shadow-md hover:shadow-lg"
              variant="outline"
            >
              <div className="rounded-lg bg-gradient-to-br from-[#31aba3]/10 to-[#2a9a92]/5 p-3 group-hover:from-[#31aba3]/20 group-hover:to-[#2a9a92]/10 transition-all">
                <Users className="h-6 w-6 text-[#31aba3]" />
              </div>
              <span className="font-semibold">
                Manage Users
              </span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Template Management */}
      <Card className="border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-200">
          <CardTitle className="text-xl text-slate-900">Template Management</CardTitle>
          <CardDescription className="text-slate-600">Manage SOAP templates and assignments</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 pt-6">
          <Link href="/admin/templates/soap/new" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02] bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30"
              variant="default"
            >
              <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-semibold">
                Create SOAP Template
              </span>
            </Button>
          </Link>
          <Link href="/admin/templates/soap" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02] border-2 border-slate-200 hover:border-[#31aba3] hover:bg-teal-50/50 text-slate-700 hover:text-[#31aba3] shadow-md hover:shadow-lg"
              variant="outline"
            >
              <div className="rounded-lg bg-gradient-to-br from-[#31aba3]/10 to-[#2a9a92]/5 p-3 group-hover:from-[#31aba3]/20 group-hover:to-[#2a9a92]/10 transition-all">
                <ClipboardList className="h-6 w-6 text-[#31aba3]" />
              </div>
              <span className="font-semibold">
                Browse Templates
              </span>
            </Button>
          </Link>
          <Link href="/admin/soap-playground" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02] border-2 border-slate-200 hover:border-[#31aba3] hover:bg-teal-50/50 text-slate-700 hover:text-[#31aba3] shadow-md hover:shadow-lg"
              variant="outline"
            >
              <div className="rounded-lg bg-gradient-to-br from-[#31aba3]/10 to-[#2a9a92]/5 p-3 group-hover:from-[#31aba3]/20 group-hover:to-[#2a9a92]/10 transition-all">
                <FlaskConical className="h-6 w-6 text-[#31aba3]" />
              </div>
              <span className="font-semibold">SOAP Playground</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
