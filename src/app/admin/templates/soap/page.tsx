"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Plus, Loader2, ClipboardList } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable } from "~/components/ui/data-table";
import { getColumns } from "~/components/admin/soap-templates-columns";
import { SoapTemplatesFilters } from "~/components/admin/SoapTemplatesFilters";
import { ShareDialog } from "~/components/admin/ShareDialog";

export default function SoapTemplatesPage() {
  // Filter state
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Query templates
  const {
    data: templates,
    isLoading,
    refetch,
  } = api.templates.listSoapTemplates.useQuery({ search: "" });

  // Query users for filter dropdown
  const { data: users } = api.templates.listUsers.useQuery();

  // Delete mutation
  const deleteMutation = api.templates.deleteSoapTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleShare = (id: string, name: string) => {
    setSelectedTemplate({ id, name });
    setShareDialogOpen(true);
  };

  // Filter templates based on selected filters
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates.filter((template) => {
      // User filter
      if (userFilter !== "all") {
        if (userFilter === "unassigned") {
          if (template.user_id !== null) return false;
        } else {
          if (template.user_id !== userFilter) return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "default" && !template.is_default) return false;
        if (statusFilter === "non-default" && template.is_default) return false;
      }

      return true;
    });
  }, [templates, userFilter, statusFilter]);

  const handleClearFilters = () => {
    setUserFilter("all");
    setStatusFilter("all");
  };

  const columns = getColumns({
    onDelete: (id: string, name: string) => void handleDelete(id, name),
    onShare: handleShare,
    isDeleting: deleteMutation.isPending,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <ClipboardList className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              SOAP Templates
            </h1>
          </div>
          <p className="text-muted-foreground text-base">
            Manage SOAP note templates and assign them to users
          </p>
        </div>
        <Link href="/admin/templates/soap/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Templates DataTable */}
      <Card className="rounded-xl bg-transparent shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Templates</CardTitle>
          <CardDescription>
            Browse and manage all SOAP note templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Loading templates...
                </p>
              </div>
            </div>
          ) : templates && templates.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredTemplates}
              searchKey="template_name"
              searchPlaceholder="Search templates..."
              filterComponent={
                <SoapTemplatesFilters
                  users={users}
                  userFilter={userFilter}
                  statusFilter={statusFilter}
                  onUserFilterChange={setUserFilter}
                  onStatusFilterChange={setStatusFilter}
                  onClearFilters={handleClearFilters}
                />
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="bg-muted rounded-full p-8">
                <ClipboardList className="text-muted-foreground h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No templates found</h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Get started by creating your first SOAP template
                </p>
              </div>
              <Link href="/admin/templates/soap/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create your first template
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      {selectedTemplate && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          entityType="soap_template"
          entityId={selectedTemplate.id}
          entityName={selectedTemplate.name}
        />
      )}
    </div>
  );
}
