import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage SOAP templates and user assignments
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common template management tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/templates/soap/new">
            <Button className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create SOAP Template
            </Button>
          </Link>
          <Link href="/admin/templates/soap">
            <Button className="w-full" variant="outline">
              <ClipboardList className="mr-2 h-4 w-4" />
              Browse SOAP Templates
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            How to use the template management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">1. Create Templates</h3>
            <p className="text-sm text-muted-foreground">
              Create SOAP note templates with customizable sections and AI prompts.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">2. Assign to Users</h3>
            <p className="text-sm text-muted-foreground">
              When editing a template, select which user it should be assigned to from the dropdown.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">3. Set Defaults</h3>
            <p className="text-sm text-muted-foreground">
              Mark templates as default to make them available to all users.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
