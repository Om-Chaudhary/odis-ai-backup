import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  FlaskConical,
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { headers } from "next/headers";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export default async function AdminDashboard() {
  const hdrs = await headers();
  const ctx = await createTRPCContext({ headers: hdrs });
  const caller = createCaller(ctx);
  const stats = await caller.cases.getCaseStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-50 p-2">
            <LayoutDashboard className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-base text-slate-600">
          Manage cases, templates, and users across your practice
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Total Cases
            </CardTitle>
            <Briefcase className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats.totalCases}
            </div>
            <p className="text-xs text-slate-600">All veterinary cases</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Ongoing Cases
            </CardTitle>
            <Activity className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats.byStatus.ongoing}
            </div>
            <p className="text-xs text-slate-600">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats.byStatus.completed}
            </div>
            <p className="text-xs text-slate-600">Finished cases</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Needs Review
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats.byStatus.draft}
            </div>
            <p className="text-xs text-slate-600">Draft cases</p>
          </CardContent>
        </Card>
      </div>

      {/* Case Type Breakdown */}
      <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-800">Case Distribution</CardTitle>
          <CardDescription className="text-slate-600">
            Breakdown by case type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Checkup</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.byType.checkup}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Emergency</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.byType.emergency}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Surgery</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.byType.surgery}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <FileCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Follow-up</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.byType.follow_up}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-slate-800">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-slate-600">
            Common management tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Link href="/admin/templates/soap/new" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] py-6 text-white transition-all hover:scale-[1.02] hover:shadow-lg"
              variant="default"
            >
              <div className="rounded-lg bg-white/20 p-2">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">New SOAP</span>
            </Button>
          </Link>
          <Link href="/admin/templates/soap" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white/90 py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-600"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">SOAP Templates</span>
            </Button>
          </Link>
          <Link href="/admin/templates/discharge" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white/90 py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-600"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Discharge Templates</span>
            </Button>
          </Link>
          <Link href="/admin/cases" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white/90 py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-600"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Cases</span>
            </Button>
          </Link>
          <Link href="/admin/users" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white/90 py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-600"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Users</span>
            </Button>
          </Link>
          <Link href="/admin/soap-playground" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 border-slate-200 bg-white/90 py-6 text-slate-700 transition-all hover:scale-[1.02] hover:bg-teal-50 hover:text-teal-600"
              variant="outline"
            >
              <div className="rounded-lg bg-teal-50 p-2">
                <FlaskConical className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Playground</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
