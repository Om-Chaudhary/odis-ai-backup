"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/client";
import { Button } from "@odis/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@odis/ui/card";
import {
  Loader2,
  Briefcase,
  Eye,
  Trash2,
  Filter,
  X,
  Share2,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@odis/ui/data-table";
import { Badge } from "@odis/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis/ui/select";
import type { RouterOutputs } from "~/trpc/client";
import { ShareDialog } from "~/components/admin/ShareDialog";
import { CaseMultiAddDialog } from "~/components/admin/CaseMultiAddDialog";

type Case = RouterOutputs["cases"]["listCases"][number];

export default function CasesPage() {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<{
    id: string;
    patientName: string;
  } | null>(null);

  // Multi-add dialog state
  const [multiAddDialogOpen, setMultiAddDialogOpen] = useState(false);

  // Query cases
  const { data: cases, isLoading, refetch } = api.cases.listCases.useQuery({});

  // Delete mutation
  const deleteMutation = api.cases.deleteCase.useMutation({
    onSuccess: () => {
      toast.success("Case deleted successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete case");
    },
  });

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this case? This will also delete all related SOAP notes, discharge summaries, and patient records.",
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  const handleShare = (id: string, patientName: string) => {
    setSelectedCase({ id, patientName });
    setShareDialogOpen(true);
  };

  // Filter cases
  const filteredCases = useMemo(() => {
    if (!cases) return [];

    return cases.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (visibilityFilter !== "all" && c.visibility !== visibilityFilter)
        return false;
      return true;
    });
  }, [cases, statusFilter, typeFilter, visibilityFilter]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    visibilityFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setVisibilityFilter("all");
  };

  const columns: ColumnDef<Case>[] = [
    {
      accessorKey: "patient",
      header: "Patient",
      cell: ({ row }) => {
        // Supabase relation may come back as an object or an array depending on config
        const rawPatient = row.original.patient as unknown;
        const patientObj = Array.isArray(rawPatient)
          ? (rawPatient[0] as
              | { name?: string; owner_name?: string }
              | undefined)
          : (rawPatient as { name?: string; owner_name?: string } | undefined);

        const patientName = patientObj?.name ?? "Unknown";
        const ownerName = patientObj?.owner_name;

        return (
          <div className="flex flex-col">
            <span className="font-medium">{patientName}</span>
            {ownerName && (
              <span className="text-muted-foreground text-xs">
                Owner: {ownerName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type as string | null | undefined;
        const colors: Record<string, string> = {
          checkup: "bg-blue-500/10 text-blue-500",
          emergency: "bg-red-500/10 text-red-500",
          surgery: "bg-purple-500/10 text-purple-500",
          follow_up: "bg-green-500/10 text-green-500",
        };
        return type ? (
          <Badge variant="secondary" className={colors[type] ?? ""}>
            {String(type).replace("_", " ")}
          </Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as string | null | undefined;
        const colors: Record<string, string> = {
          draft: "bg-gray-500/10 text-gray-500",
          ongoing: "bg-blue-500/10 text-blue-500",
          completed: "bg-green-500/10 text-green-500",
          reviewed: "bg-purple-500/10 text-purple-500",
        };
        return status ? (
          <Badge variant="secondary" className={colors[status] ?? ""}>
            {status}
          </Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: "visibility",
      header: "Visibility",
      cell: ({ row }) => {
        const visibility = row.original.visibility as string | null | undefined;
        return visibility ? (
          <Badge variant="outline">{visibility}</Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = row.original.created_at
          ? new Date(row.original.created_at)
          : null;
        return date ? (
          <span className="text-muted-foreground text-sm">
            {date.toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const rawPatient = row.original.patient as unknown;
        const patientObj = Array.isArray(rawPatient)
          ? (rawPatient[0] as { name?: string } | undefined)
          : (rawPatient as { name?: string } | undefined);
        const patientName = patientObj?.name ?? "Unknown";
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1.5 hover:text-blue-500"
              onClick={() => handleShare(row.original.id, patientName)}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Link href={`/admin/cases/${row.original.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-1.5"
              onClick={() => void handleDelete(row.original.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Briefcase className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Case Management
            </h1>
          </div>
          <p className="text-muted-foreground text-base">
            View and manage all veterinary cases
          </p>
        </div>
        <Button
          onClick={() => setMultiAddDialogOpen(true)}
          className="gap-2"
          size="lg"
        >
          <FolderPlus className="h-5 w-5" />
          Create Cases
        </Button>
      </div>

      {/* Cases DataTable */}
      <Card className="rounded-xl bg-transparent shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Cases</CardTitle>
          <CardDescription>
            Browse and manage all veterinary cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Loading cases...
                </p>
              </div>
            </div>
          ) : cases && cases.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredCases}
              searchKey="patient.name"
              searchPlaceholder="Search by patient or owner..."
              filterComponent={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="checkup">Checkup</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={visibilityFilter}
                    onValueChange={setVisibilityFilter}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={clearFilters}
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="bg-muted rounded-full p-8">
                <Briefcase className="text-muted-foreground h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No cases found</h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                  No veterinary cases in the system yet
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      {selectedCase && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          entityType="case"
          entityId={selectedCase.id}
          entityName={`Case: ${selectedCase.patientName}`}
        />
      )}

      {/* Multi-Add Dialog */}
      <CaseMultiAddDialog
        open={multiAddDialogOpen}
        onOpenChange={setMultiAddDialogOpen}
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
