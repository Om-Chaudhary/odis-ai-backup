"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";

interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface SoapTemplatesFiltersProps {
  users: User[] | undefined;
  userFilter: string;
  statusFilter: string;
  onUserFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function SoapTemplatesFilters({
  users,
  userFilter,
  statusFilter,
  onUserFilterChange,
  onStatusFilterChange,
  onClearFilters,
}: SoapTemplatesFiltersProps) {
  const hasFilters = userFilter !== "all" || statusFilter !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* User Filter */}
      <Select value={userFilter} onValueChange={onUserFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {users?.map((user) => {
            const displayName =
              user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.email;
            return (
              <SelectItem key={user.id} value={user.id}>
                {displayName}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="default">Default Only</SelectItem>
          <SelectItem value="non-default">Non-Default Only</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 px-2 lg:px-3"
        >
          Clear
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
