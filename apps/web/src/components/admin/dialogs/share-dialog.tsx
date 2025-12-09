"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis/ui/dialog";
import { Button } from "@odis/ui/button";
import { Checkbox } from "@odis/ui/checkbox";
import { Label } from "@odis/ui/label";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "soap_template" | "discharge_template" | "case";
  entityId: string;
  entityName: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
}: ShareDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Query all users
  const { data: users, isLoading: isLoadingUsers } =
    api.templates.listUsers.useQuery(undefined, { enabled: open });

  // Query current shares based on entity type
  const { data: soapShares } = api.sharing.listSoapTemplateShares.useQuery(
    { entityId },
    { enabled: open && entityType === "soap_template" },
  );

  const { data: dischargeShares } =
    api.sharing.listDischargeTemplateShares.useQuery(
      { entityId },
      { enabled: open && entityType === "discharge_template" },
    );

  const { data: caseShares } = api.sharing.listCaseShares.useQuery(
    { entityId },
    { enabled: open && entityType === "case" },
  );

  // Update mutation
  const updateSharesMutation = api.sharing.updateEntityShares.useMutation({
    onSuccess: () => {
      toast.success("Sharing updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update sharing");
    },
  });

  // Get current shares
  const currentShares =
    entityType === "soap_template"
      ? soapShares
      : entityType === "discharge_template"
        ? dischargeShares
        : caseShares;

  // Initialize selected users when shares load
  useEffect(() => {
    if (currentShares) {
      const sharedUserIds = currentShares
        .map((share) => {
          const user = share.user as unknown as { id: string } | null;
          return user?.id;
        })
        .filter((id): id is string => !!id);
      setSelectedUserIds(sharedUserIds);
    }
  }, [currentShares]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSave = async () => {
    await updateSharesMutation.mutateAsync({
      entityType,
      entityId,
      userIds: selectedUserIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {entityType.replace("_", " ")}
          </DialogTitle>
          <DialogDescription>
            Select users who should have access to &quot;{entityName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="hover:bg-accent/50 flex items-start space-x-3 rounded-lg border p-3 transition-colors"
                >
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={() => handleToggleUser(user.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="cursor-pointer leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {user.first_name} {user.last_name}
                    </Label>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {user.email}
                    </p>
                    {user.role && (
                      <p className="text-muted-foreground mt-0.5 text-xs capitalize">
                        {String(user.role).replace("_", " ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No users available to share with
            </p>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSharesMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateSharesMutation.isPending}
            >
              {updateSharesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
