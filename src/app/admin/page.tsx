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
          <div className="bg-primary/10 rounded-lg p-2">
            <LayoutDashboard className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-base">
          Manage cases, templates, and users across your practice
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Briefcase className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-muted-foreground text-xs">
              All veterinary cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Cases</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.ongoing}</div>
            <p className="text-muted-foreground text-xs">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.completed}</div>
            <p className="text-muted-foreground text-xs">Finished cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.draft}</div>
            <p className="text-muted-foreground text-xs">Draft cases</p>
          </CardContent>
        </Card>
      </div>

      {/* Case Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Case Distribution</CardTitle>
          <CardDescription>Breakdown by case type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Checkup
                </p>
                <p className="text-2xl font-bold">{stats.byType.checkup}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Emergency
                </p>
                <p className="text-2xl font-bold">{stats.byType.emergency}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Surgery
                </p>
                <p className="text-2xl font-bold">{stats.byType.surgery}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <FileCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Follow-up
                </p>
                <p className="text-2xl font-bold">{stats.byType.follow_up}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Common management tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Link href="/admin/templates/soap/new" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-6 transition-all hover:scale-[1.02]"
              variant="default"
            >
              <div className="bg-primary-foreground/10 rounded-lg p-2">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">New SOAP</span>
            </Button>
          </Link>
          <Link href="/admin/templates/soap" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-6 transition-all hover:scale-[1.02]"
              variant="outline"
            >
              <div className="bg-muted rounded-lg p-2">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">SOAP Templates</span>
            </Button>
          </Link>
          <Link href="/admin/templates/discharge" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-6 transition-all hover:scale-[1.02]"
              variant="outline"
            >
              <div className="bg-muted rounded-lg p-2">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Discharge Templates</span>
            </Button>
          </Link>
          <Link href="/admin/cases" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-6 transition-all hover:scale-[1.02]"
              variant="outline"
            >
              <div className="bg-muted rounded-lg p-2">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Cases</span>
            </Button>
          </Link>
          <Link href="/admin/users" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-6 transition-all hover:scale-[1.02]"
              variant="outline"
            >
              <div className="bg-muted rounded-lg p-2">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Users</span>
            </Button>
          </Link>
          <Link href="/admin/soap-playground" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-6 transition-all hover:scale-[1.02]"
              variant="outline"
            >
              <div className="bg-muted rounded-lg p-2">
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
