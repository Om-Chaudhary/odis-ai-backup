import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ClipboardList, Plus, FlaskConical, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-base text-muted-foreground">
          Manage SOAP templates and user assignments
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Common template management tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/templates/soap/new" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02]"
              variant="default"
            >
              <div className="rounded-lg bg-primary-foreground/10 p-3">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-semibold">
                Create SOAP Template
              </span>
            </Button>
          </Link>
          <Link href="/admin/templates/soap" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02]"
              variant="outline"
            >
              <div className="rounded-lg bg-muted p-3">
                <ClipboardList className="h-6 w-6" />
              </div>
              <span className="font-semibold">
                Browse Templates
              </span>
            </Button>
          </Link>
          <Link href="/admin/soap-playground" className="group">
            <Button
              className="h-auto w-full flex-col gap-3 py-8 transition-all hover:scale-[1.02]"
              variant="outline"
            >
              <div className="rounded-lg bg-muted p-3">
                <FlaskConical className="h-6 w-6" />
              </div>
              <span className="font-semibold">SOAP Playground</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
