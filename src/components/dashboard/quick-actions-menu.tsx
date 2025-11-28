"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { MoreHorizontal, FileText, FileCheck, Eye } from "lucide-react";

interface QuickActionsMenuProps {
  caseId: string;
  hasSoapNote?: boolean;
  hasDischargeSummary?: boolean;
  onGenerateSoap?: () => void;
  onGenerateDischarge?: () => void;
}

export function QuickActionsMenu({
  caseId,
  hasSoapNote = false,
  hasDischargeSummary = false,
  onGenerateSoap,
  onGenerateDischarge,
}: QuickActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="transition-smooth h-8 w-8 text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onGenerateSoap && (
          <DropdownMenuItem
            onClick={onGenerateSoap}
            disabled={hasSoapNote}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {hasSoapNote ? "SOAP Note Exists" : "Generate SOAP Note"}
          </DropdownMenuItem>
        )}
        {onGenerateDischarge && (
          <DropdownMenuItem
            onClick={onGenerateDischarge}
            disabled={hasDischargeSummary}
            className="gap-2"
          >
            <FileCheck className="h-4 w-4" />
            {hasDischargeSummary
              ? "Discharge Summary Exists"
              : "Generate Discharge Summary"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/cases/${caseId}`} className="gap-2">
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
