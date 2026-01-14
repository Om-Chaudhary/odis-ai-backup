"use client";

import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@odis-ai/shared/ui/dropdown-menu";

export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  separator?: boolean;
  href?: string;
  shortcut?: string;
}

interface DataTableRowActionsProps {
  actions: ActionItem[];
  label?: string; // e.g. "Actions"
}

export function DataTableRowActions({
  actions,
  label = "Open menu",
}: DataTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {actions.map((action, index) => {
          if (action.separator) {
            return <DropdownMenuSeparator key={index} />;
          }

          if (action.onClick || action.href) {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={action.className}
              >
                {Icon && (
                  <Icon className="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
                )}
                {action.label}
                {action.shortcut && (
                  <span className="ml-auto text-xs tracking-widest opacity-60">
                    {action.shortcut}
                  </span>
                )}
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuLabel key={index}>{action.label}</DropdownMenuLabel>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
