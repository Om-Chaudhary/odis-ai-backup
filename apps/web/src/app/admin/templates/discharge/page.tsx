"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { Button } from "@odis/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis/ui/card";
import { Plus, Loader2, FileText, Pencil, Trash2, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@odis/ui/data-table";
import { Badge } from "@odis/ui/badge";
import { ShareDialog } from "~/components/admin/ShareDialog";
import type { RouterOutputs } from "~/trpc/client";

type DischargeTemplate =
  RouterOutputs["templates"]["listDischargeSummaryTemplates"][number];

export default function DischargeTemplatesPage() {
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
  } = api.templates.listDischargeSummaryTemplates.useQuery({ search: "" });

  // Delete mutation
  const deleteMutation =
    api.templates.deleteDischargeSummaryTemplate.useMutation({
      onSuccess: () => {
        toast.success("Template deleted successfully");
        void refetch();
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete template");
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

  const columns: ColumnDef<DischargeTemplate>[] = [
    {
      accessorKey: "name",
      header: "Template Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_default && (
            <Badge variant="secondary" className="text-xs">
              Default
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "user",
      header: "Assigned To",
      cell: ({ row }) => {
        const user = row.original.user as unknown as {
          email?: string;
          first_name?: string;
          last_name?: string;
        } | null;
        if (!user) {
          return <span className="text-muted-foreground">Unassigned</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {user.first_name ?? ""} {user.last_name ?? ""}
            </span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at as unknown as string);
        return (
          <span className="text-muted-foreground text-sm">
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5 hover:text-blue-500"
            onClick={() => handleShare(row.original.id, row.original.name)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Link href={`/admin/templates/discharge/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() =>
              void handleDelete(row.original.id, row.original.name)
            }
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <FileText className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Discharge Summary Templates
            </h1>
          </div>
          <p className="text-muted-foreground text-base">
            Manage discharge summary templates and assign them to users
          </p>
        </div>
        <Link href="/admin/templates/discharge/new">
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
            Browse and manage all discharge summary templates
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
              data={templates}
              searchKey="name"
              searchPlaceholder="Search templates..."
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="bg-muted rounded-full p-8">
                <FileText className="text-muted-foreground h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No templates found</h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Get started by creating your first discharge summary template
                </p>
              </div>
              <Link href="/admin/templates/discharge/new">
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
          entityType="discharge_template"
          entityId={selectedTemplate.id}
          entityName={selectedTemplate.name}
        />
      )}
    </div>
  );
}
