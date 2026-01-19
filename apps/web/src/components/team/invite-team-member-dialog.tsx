"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/shared/ui/dialog";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Label } from "@odis-ai/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { toast } from "sonner";

interface InviteTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Invite Team Member Dialog
 *
 * Uses Clerk's native organization invitations to invite new team members.
 * Only org admins and owners can invite users.
 */
export function InviteTeamMemberDialog({
  open,
  onOpenChange,
}: InviteTeamMemberDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: "org:member" as
      | "org:owner"
      | "org:admin"
      | "org:veterinarian"
      | "org:member"
      | "org:viewer",
  });

  const inviteMutation = api.team.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      onOpenChange(false);
      setFormData({
        email: "",
        role: "org:member",
      });
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to send invitation");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    inviteMutation.mutate({
      email: formData.email,
      role: formData.role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your clinic. They'll receive an email
            with a link to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="colleague@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(
                value:
                  | "org:owner"
                  | "org:admin"
                  | "org:veterinarian"
                  | "org:member"
                  | "org:viewer",
              ) => setFormData((prev) => ({ ...prev, role: value }))}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org:owner">
                  <div>
                    <div className="font-medium">Owner</div>
                    <div className="text-xs text-muted-foreground">
                      Full access, manage billing and team
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="org:admin">
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs text-muted-foreground">
                      Administrative functions, team management
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="org:veterinarian">
                  <div>
                    <div className="font-medium">Veterinarian</div>
                    <div className="text-xs text-muted-foreground">
                      Medical decisions, discharge approval
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="org:member">
                  <div>
                    <div className="font-medium">Member</div>
                    <div className="text-xs text-muted-foreground">
                      View/edit cases, make calls
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="org:viewer">
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-xs text-muted-foreground">
                      Read-only access
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
