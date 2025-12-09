"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis/ui/select";
import { Button } from "@odis/ui/button";
import { Input } from "@odis/ui/input";
import { Label } from "@odis/ui/label";
import { Loader2, Plus, X, FolderPlus } from "lucide-react";
import { toast } from "sonner";

interface CaseMultiAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CaseEntry {
  id: string;
  userId: string;
  patientName: string;
}

export function CaseMultiAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: CaseMultiAddDialogProps) {
  const [entries, setEntries] = useState<CaseEntry[]>([
    { id: crypto.randomUUID(), userId: "", patientName: "" },
  ]);

  // Query users for dropdown
  const { data: users, isLoading: isLoadingUsers } =
    api.users.getUsersForSelector.useQuery(undefined, { enabled: open });

  // Bulk create mutation
  const bulkCreateMutation = api.cases.bulkCreateCases.useMutation({
    onSuccess: (results) => {
      const successCount = results.successful.length;
      const failCount = results.failed.length;

      if (successCount > 0) {
        toast.success(
          `Successfully created ${successCount} case${successCount > 1 ? "s" : ""}`,
        );
      }

      if (failCount > 0) {
        // Show details of failed entries
        results.failed.forEach((failure) => {
          toast.error(
            `Failed to create case for ${failure.patientName}: ${failure.error}`,
          );
        });
      }

      // Only close dialog if all succeeded
      if (failCount === 0) {
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      }
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create cases");
    },
  });

  const resetForm = () => {
    setEntries([{ id: crypto.randomUUID(), userId: "", patientName: "" }]);
  };

  const handleAddEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), userId: "", patientName: "" },
    ]);
  };

  const handleRemoveEntry = (id: string) => {
    if (entries.length === 1) return; // Don't remove if only one entry
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleUpdateEntry = (
    id: string,
    field: "userId" | "patientName",
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const handleSubmit = async () => {
    // Validate all entries
    const invalidEntries = entries.filter(
      (entry) => !entry.userId || entry.patientName.length < 2,
    );

    if (invalidEntries.length > 0) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    // Convert entries to mutation input format
    const input = entries.map((entry) => ({
      userId: entry.userId,
      patientName: entry.patientName,
    }));

    await bulkCreateMutation.mutateAsync(input);
  };

  const isValid = entries.every(
    (entry) => entry.userId && entry.patientName.length >= 2,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create Multiple Cases
          </DialogTitle>
          <DialogDescription>
            Add multiple cases with patients. Each row will create one case and
            one patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[1fr_1fr_auto] gap-3 rounded-lg border p-3"
                  >
                    {/* User Select */}
                    <div className="space-y-2">
                      <Label htmlFor={`user-${entry.id}`}>User</Label>
                      <Select
                        value={entry.userId}
                        onValueChange={(value) =>
                          handleUpdateEntry(entry.id, "userId", value)
                        }
                      >
                        <SelectTrigger
                          id={`user-${entry.id}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span>
                                  {user.first_name} {user.last_name}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {user.email}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Patient Name Input */}
                    <div className="space-y-2">
                      <Label htmlFor={`patient-${entry.id}`}>
                        Patient Name
                      </Label>
                      <Input
                        id={`patient-${entry.id}`}
                        value={entry.patientName}
                        onChange={(e) =>
                          handleUpdateEntry(
                            entry.id,
                            "patientName",
                            e.target.value,
                          )
                        }
                        placeholder="Enter patient name..."
                        minLength={2}
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEntry(entry.id)}
                        disabled={entries.length === 1}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove entry</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Another Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEntry}
                className="w-full"
                disabled={bulkCreateMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Case
              </Button>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    resetForm();
                  }}
                  disabled={bulkCreateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || bulkCreateMutation.isPending}
                >
                  {bulkCreateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create {entries.length} Case
                      {entries.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
