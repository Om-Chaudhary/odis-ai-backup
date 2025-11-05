"use client";

import { DataTable } from "~/components/ui/data-table";
import { columns } from "./call-table-columns";
import type { CallDetailResponse } from "~/server/actions/retell";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";

interface CallsDataTableProps {
  data: CallDetailResponse[];
  isLoading?: boolean;
}

export function CallsDataTable({ data, isLoading: _isLoading = false }: CallsDataTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter data based on status
  const filteredData =
    statusFilter === "all"
      ? data
      : data.filter((call) => call.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-end gap-4">
        <div className="w-[200px]">
          <Label htmlFor="status-filter" className="text-sm mb-2 block">
            Filter by Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="initiated">Initiated</SelectItem>
              <SelectItem value="ringing">Ringing</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} calls
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Search by pet name or owner..."
        searchKey="pet_name"
      />
    </div>
  );
}
