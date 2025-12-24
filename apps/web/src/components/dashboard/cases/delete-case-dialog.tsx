"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Button } from "@odis-ai/shared/ui/button";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  patientName?: string;
  onSuccess?: () => void;
}

export function DeleteCaseDialog({
  open,
  onOpenChange,
  caseId,
  patientName,
  onSuccess,
}: DeleteCaseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = api.useUtils();

  const deleteMutation = api.cases.deleteMyCase.useMutation({
    onSuccess: () => {
      toast.success("Case deleted successfully");
      void utils.dashboard.getAllCases.invalidate();
      void utils.dashboard.getCaseStats.invalidate();
      void utils.outbound.listDischargeCases.invalidate();
      void utils.outbound.getDischargeCaseStats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete case");
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    deleteMutation.mutate({ id: caseId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Case</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this case
            {patientName ? ` for ${patientName}` : ""}? This action cannot be
            undone and will permanently delete the case and all associated data,
            including SOAP notes, discharge summaries, and related records.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Case
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
