"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@odis/ui/dropdown-menu";
import { Button } from "@odis/ui/button";
import { MoreHorizontal, FileText, FileCheck, Eye, Trash2 } from "lucide-react";
import { DeleteCaseDialog } from "./delete-case-dialog";

interface QuickActionsMenuProps {
  caseId: string;
  hasSoapNote?: boolean;
  hasDischargeSummary?: boolean;
  patientName?: string;
  onGenerateSoap?: () => void;
  onGenerateDischarge?: () => void;
  onDelete?: () => void;
}

export function QuickActionsMenu({
  caseId,
  hasSoapNote = false,
  hasDischargeSummary = false,
  patientName,
  onGenerateSoap,
  onGenerateDischarge,
  onDelete,
}: QuickActionsMenuProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleGenerateSoap = () => {
    if (onGenerateSoap) {
      onGenerateSoap();
    } else {
      // Navigate to case detail page where SOAP generation can be initiated
      router.push(`/dashboard/discharges/${caseId}?action=generate-soap`);
    }
  };

  const handleGenerateDischarge = () => {
    if (onGenerateDischarge) {
      onGenerateDischarge();
    } else {
      // Navigate to case detail page where discharge generation can be initiated
      router.push(`/dashboard/discharges/${caseId}?action=generate-discharge`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    onDelete?.();
  };

  return (
    <>
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
          <DropdownMenuItem
            onClick={handleGenerateSoap}
            disabled={hasSoapNote}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {hasSoapNote ? "SOAP Note Exists" : "Generate SOAP Note"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleGenerateDischarge}
            disabled={hasDischargeSummary}
            className="gap-2"
          >
            <FileCheck className="h-4 w-4" />
            {hasDischargeSummary
              ? "Discharge Summary Exists"
              : "Generate Discharge Summary"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/discharges/${caseId}`} className="gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="text-destructive focus:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Case
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteCaseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        caseId={caseId}
        patientName={patientName}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}
