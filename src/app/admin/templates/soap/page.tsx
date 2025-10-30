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

export default function SoapTemplatesPage() {
  // Filter state
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    isDeleting: deleteMutation.isPending,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-[#31aba3] to-[#2a9a92] p-3 shadow-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              SOAP Templates
            </h1>
          </div>
          <p className="text-base text-slate-600">
            Manage SOAP note templates and assign them to users
          </p>
        </div>
        <Link href="/admin/templates/soap/new">
          <Button size="lg" className="gap-2 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30 transition-all hover:scale-105">
            <Plus className="h-5 w-5" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Templates DataTable */}
      <Card className="rounded-xl border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-200">
          <CardTitle className="text-xl text-slate-900">Templates</CardTitle>
          <CardDescription className="text-slate-600">
            Browse and manage all SOAP note templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#31aba3]" />
                <p className="text-sm text-slate-600">
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
              <div className="rounded-full bg-gradient-to-br from-[#31aba3]/10 to-[#2a9a92]/5 p-8">
                <ClipboardList className="h-12 w-12 text-[#31aba3]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">No templates found</h3>
                <p className="max-w-sm text-sm text-slate-600">
                  Get started by creating your first SOAP template
                </p>
              </div>
              <Link href="/admin/templates/soap/new">
                <Button className="gap-2 bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white shadow-lg hover:shadow-xl hover:shadow-[#31aba3]/30 transition-all hover:scale-105">
                  <Plus className="h-4 w-4" />
                  Create your first template
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
