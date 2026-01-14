"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/dropdown-menu";

interface DataTableViewOptionsProps {
  // If we were using TanStack table directly, we'd pass the table instance.
  // For now, we'll accept a simplified interface for standard usage.
  options: {
    id: string;
    label: string;
    isVisible: boolean;
    onToggle: (checked: boolean) => void;
  }[];
}

export function DataTableViewOptions({ options }: DataTableViewOptionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.isVisible}
              onCheckedChange={(value) => column.onToggle(!!value)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
